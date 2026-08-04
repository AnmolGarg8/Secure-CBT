import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role, User } from '../generated/client/index.js';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as crypto from 'crypto';
import { getJwtKeys } from '../common/keys.js';
import { encryptMfaSecret, decryptMfaSecret } from '../common/crypto.js';
import { logAuditEvent } from '../common/audit.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Hash helper for storing refresh tokens
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Generate real Access and Refresh token pair
  async generateTokens(user: Pick<User, 'id' | 'email' | 'role' | 'institutionId'>, deviceFingerprint?: string) {
    const { privateKey } = getJwtKeys();
    
    // Access Token: 15 minutes expiry
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    };
    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      privateKey,
      algorithm: 'RS256',
      expiresIn: '15m',
    });

    // Refresh Token: 30 days expiry, high-entropy random string
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        deviceFingerprint,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  // POST /auth/register
  async register(
    actor: { role: Role; institutionId: string },
    dto: { email: string; passwordHash: string; role: Role; institutionId?: string },
  ) {
    // Determine which institution to register under
    let targetInstitutionId = actor.institutionId;

    if (actor.role === Role.SUPER_ADMIN) {
      if (!dto.institutionId) {
        throw new BadRequestException('SUPER_ADMIN must specify target institutionId');
      }
      targetInstitutionId = dto.institutionId;
    } else if (actor.role === Role.INSTITUTION_ADMIN) {
      // INSTITUTION_ADMIN can only register users in their own institution
      if (dto.institutionId && dto.institutionId !== actor.institutionId) {
        throw new ForbiddenException('Cannot register users for a different institution');
      }
    } else {
      throw new ForbiddenException('Only INSTITUTION_ADMIN or SUPER_ADMIN can register users');
    }

    // Check if institution exists
    const inst = await this.prisma.institution.findUnique({ where: { id: targetInstitutionId } });
    if (!inst) {
      throw new BadRequestException('Target institution does not exist');
    }

    // Check uniqueness within the institution
    const existing = await this.prisma.user.findUnique({
      where: {
        email_institutionId: {
          email: dto.email,
          institutionId: targetInstitutionId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('User already exists in this institution');
    }

    // Hash the password using Argon2id
    const passwordHash = await argon2.hash(dto.passwordHash, { type: argon2.argon2id });

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        institutionId: targetInstitutionId,
      },
    });

    logAuditEvent({
      event: 'USER_REGISTERED',
      actorUserId: (actor as any).sub || actor.role,
      targetUserId: newUser.id,
      institutionId: targetInstitutionId,
      metadata: { role: newUser.role },
    });

    const userResponse = { ...newUser } as Partial<User>;
    delete userResponse.passwordHash;
    delete userResponse.mfaSecret;
    return userResponse;
  }

  // POST /auth/login
  async login(dto: { email: string; passwordHash: string; institutionId: string }, ipAddress: string, userAgent: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        institutionId: dto.institutionId,
      },
    });

    // Handle failure generically to avoid email enumeration
    const failLogin = async () => {
      if (user) {
        await this.prisma.loginAttempt.create({
          data: {
            userId: user.id,
            email: dto.email,
            success: false,
            ipAddress,
            userAgent,
          },
        });
      } else {
        await this.prisma.loginAttempt.create({
          data: {
            userId: null,
            email: dto.email,
            success: false,
            ipAddress,
            userAgent,
          },
        });
      }

      logAuditEvent({
        event: 'LOGIN_FAILED',
        institutionId: dto.institutionId,
        metadata: { email: dto.email, ipAddress, userAgent },
      });

      throw new UnauthorizedException('Invalid credentials');
    };

    if (!user || !user.isActive) {
      return failLogin();
    }

    // Verify password via Argon2id
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.passwordHash);
    if (!isPasswordValid) {
      return failLogin();
    }

    // Successful authentication
    await this.prisma.loginAttempt.create({
      data: {
        userId: user.id,
        email: dto.email,
        success: true,
        ipAddress,
        userAgent,
      },
    });

    logAuditEvent({
      event: 'LOGIN_AUTHENTICATED',
      actorUserId: user.id,
      institutionId: user.institutionId,
      metadata: { ipAddress, mfaRequired: user.mfaEnabled },
    });

    if (user.mfaEnabled) {
      // Issue short-lived mfaChallengeToken
      const { privateKey } = getJwtKeys();
      const mfaChallengeToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          institutionId: user.institutionId,
          role: user.role,
          mfaChallenge: true,
        },
        {
          privateKey,
          algorithm: 'RS256',
          expiresIn: '5m',
        },
      );
      return {
        mfaRequired: true,
        mfaChallengeToken,
      };
    }

    // If MFA is not setup/enabled, issue tokens directly
    const tokens = await this.generateTokens(user);
    
    logAuditEvent({
      event: 'SESSION_STARTED',
      actorUserId: user.id,
      institutionId: user.institutionId,
      metadata: { mfaVerified: false },
    });

    return {
      mfaRequired: false,
      ...tokens,
    };
  }

  // POST /auth/mfa/setup
  async setupMfa(userId: string, institutionId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, institutionId },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    // Generate TOTP secret
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'SecureCBT', secret);

    // Save pending secret (encrypted)
    const encryptedSecret = encryptMfaSecret(secret);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: encryptedSecret,
        mfaEnabled: false, // Explicitly keep disabled until verified
      },
    });

    logAuditEvent({
      event: 'MFA_SETUP_INITIATED',
      actorUserId: userId,
      institutionId,
    });

    return {
      secret,
      otpauthUrl,
    };
  }

  // POST /auth/mfa/verify
  async verifyMfa(userId: string, institutionId: string, code: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, institutionId },
    });
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA has not been setup yet');
    }

    const decryptedSecret = decryptMfaSecret(user.mfaSecret);
    const isValid = authenticator.verify({ token: code, secret: decryptedSecret });
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP verification code');
    }

    // Set enabled = true
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    logAuditEvent({
      event: 'MFA_ENABLED',
      actorUserId: userId,
      institutionId,
    });

    return { success: true };
  }

  // POST /auth/mfa/challenge
  async verifyMfaChallenge(challengeToken: string, code: string) {
    const { publicKey } = getJwtKeys();
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(challengeToken, {
        publicKey,
        algorithms: ['RS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA challenge token');
    }

    if (!payload.mfaChallenge) {
      throw new UnauthorizedException('Invalid token type for MFA verification');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.mfaSecret || !user.mfaEnabled) {
      throw new UnauthorizedException('MFA not enabled for user');
    }

    const decryptedSecret = decryptMfaSecret(user.mfaSecret);
    const isValid = authenticator.verify({ token: code, secret: decryptedSecret });
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Successful MFA validation
    const tokens = await this.generateTokens(user);

    logAuditEvent({
      event: 'SESSION_STARTED',
      actorUserId: user.id,
      institutionId: user.institutionId,
      metadata: { mfaVerified: true },
    });

    return tokens;
  }

  // POST /auth/refresh
  async refreshSession(refreshToken: string, deviceFingerprint?: string) {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revocation / Reuse Detection logic
    if (storedToken.revokedAt) {
      // Compromise detected: immediately revoke all active refresh tokens for the user family
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: storedToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      logAuditEvent({
        event: 'REFRESH_TOKEN_REUSE_DETECTED',
        actorUserId: storedToken.userId,
        institutionId: storedToken.user.institutionId,
        metadata: { tokenHash },
      });

      throw new ForbiddenException('Refresh token reuse anomaly detected. Session revoked.');
    }

    // Check expiry
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke the current used token
    const now = new Date();
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: now },
    });

    // Generate rotated tokens
    const tokens = await this.generateTokens(storedToken.user, deviceFingerprint);

    logAuditEvent({
      event: 'SESSION_ROTATED',
      actorUserId: storedToken.user.id,
      institutionId: storedToken.user.institutionId,
    });

    return tokens;
  }

  // POST /auth/logout
  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (storedToken && !storedToken.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      logAuditEvent({
        event: 'SESSION_TERMINATED',
        actorUserId: storedToken.userId,
      });
    }

    return { success: true };
  }

  // GET /auth/me
  async getProfile(userId: string, institutionId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, institutionId },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const userResponse = { ...user } as Partial<User>;
    delete userResponse.passwordHash;
    delete userResponse.mfaSecret;
    return userResponse;
  }
}
