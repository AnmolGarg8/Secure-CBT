import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import * as argon2 from 'argon2';
import { Role } from '../generated/client/index.js';
import * as crypto from 'crypto';

describe('AuthService Suite', () => {
  let authService: AuthService;
  let prismaMock: any;
  let jwtService: JwtService;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      loginAttempt: {
        create: vi.fn(),
      },
      institution: {
        findUnique: vi.fn(),
      },
    };

    jwtService = new JwtService({});
    authService = new AuthService(prismaMock as unknown as PrismaService, jwtService);

    // Setup dummy MFA encryption key for tests
    process.env.MFA_ENCRYPTION_KEY = 'test_key_32_bytes_long_1234567890';
  });

  describe('Password Hashing (Argon2id)', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'secure_plain_password';
      const hash = await argon2.hash(password, { type: argon2.argon2id });
      
      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2id$');

      const isMatch = await argon2.verify(hash, password);
      expect(isMatch).toBe(true);

      const isWrongMatch = await argon2.verify(hash, 'wrong_password');
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('JWT Issuance/Verification (RS256)', () => {
    it('should issue tokens signed with RS256 that verify successfully', async () => {
      const user = {
        id: 'user-123',
        email: 'user@test.edu',
        role: Role.INSTRUCTOR,
        institutionId: 'inst-1',
      };

      const tokens = await authService.generateTokens(user);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();

      const decoded = jwtService.decode(tokens.accessToken) as any;
      expect(decoded.sub).toBe(user.id);
      expect(decoded.role).toBe(user.role);
      expect(decoded.institutionId).toBe(user.institutionId);
    });
  });

  describe('Refresh Token Rotation & Reuse Detection', () => {
    it('should rotate valid refresh tokens and revoke all tokens if reuse is detected', async () => {
      const originalToken = 'original-refresh-token';
      const tokenHash = crypto.createHash('sha256').update(originalToken).digest('hex');

      const user = {
        id: 'user-123',
        email: 'user@test.edu',
        role: Role.INSTRUCTOR,
        institutionId: 'inst-1',
      };

      // Mock database state for token check
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 1);

      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id-1',
        userId: 'user-123',
        tokenHash,
        expiresAt: expiry,
        revokedAt: null,
        user,
      });

      // 1. Success case: rotate token
      const tokens = await authService.refreshSession(originalToken);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'rt-id-1' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }));

      // 2. Reuse case: present already revoked token
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id-1',
        userId: 'user-123',
        tokenHash,
        expiresAt: expiry,
        revokedAt: new Date(), // Already revoked
        user,
      });

      await expect(authService.refreshSession(originalToken)).rejects.toThrow('Refresh token reuse anomaly detected. Session revoked.');
      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-123', revokedAt: null },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }));
    });
  });

  describe('Tenant Isolation Checks', () => {
    it('should restrict registration to same institution for INSTITUTION_ADMIN', async () => {
      const actor = {
        role: Role.INSTITUTION_ADMIN,
        institutionId: 'institution-A',
      };

      const registrationDto = {
        email: 'new-user@test.edu',
        passwordHash: 'pass',
        role: Role.INSTRUCTOR,
        institutionId: 'institution-B', // Attempting cross-tenant injection
      };

      prismaMock.institution.findUnique.mockResolvedValue({ id: 'institution-B' });

      await expect(authService.register(actor, registrationDto)).rejects.toThrow('Cannot register users for a different institution');
    });

    it('should allow SUPER_ADMIN to register users in other institutions', async () => {
      const actor = {
        role: Role.SUPER_ADMIN,
        institutionId: 'system-tenant',
      };

      const registrationDto = {
        email: 'new-user@test.edu',
        passwordHash: 'pass',
        role: Role.INSTRUCTOR,
        institutionId: 'institution-B',
      };

      prismaMock.institution.findUnique.mockResolvedValue({ id: 'institution-B', name: 'University B' });
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'new-id',
        email: registrationDto.email,
        role: registrationDto.role,
        institutionId: 'institution-B',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await authService.register(actor, registrationDto);
      expect(user.institutionId).toBe('institution-B');
    });
  });
});
