import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus, Ip } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { Roles } from './decorators/roles.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser, CurrentTenantId } from './decorators/tenant-id.decorator.js';
import { Role } from '@prisma/client';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/register - restricted to SUPER_ADMIN or INSTITUTION_ADMIN
  @Post('register')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  async register(
    @CurrentUser() actor: { role: Role; institutionId: string; sub: string },
    @Body() dto: { email: string; passwordHash: string; role: Role; institutionId?: string },
  ) {
    // Staff self-registration is disabled. Candidate self-registration:
    // TODO: Candidate self-registration will be implemented in candidate-service/portal later.
    return this.authService.register(actor, dto);
  }

  // POST /auth/login - Rate limited per IP/Email (5 attempts per 15 minutes)
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: { email: string; passwordHash: string; institutionId: string },
    @Ip() ipAddress: string,
    @Req() req: any,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.login(dto, ipAddress, userAgent);
  }

  // POST /auth/mfa/setup - authenticated
  @Post('mfa/setup')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.INSTRUCTOR, Role.PROCTOR, Role.GRADER, Role.CANDIDATE, Role.OBSERVER)
  @HttpCode(HttpStatus.OK)
  async setupMfa(
    @CurrentUser() user: any,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.authService.setupMfa(user.sub, tenantId);
  }

  // POST /auth/mfa/verify - authenticated
  @Post('mfa/verify')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.INSTRUCTOR, Role.PROCTOR, Role.GRADER, Role.CANDIDATE, Role.OBSERVER)
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @CurrentUser() user: any,
    @CurrentTenantId() tenantId: string,
    @Body() dto: { code: string },
  ) {
    return this.authService.verifyMfa(user.sub, tenantId, dto.code);
  }

  // POST /auth/mfa/challenge - verification during login challenge
  @Public()
  @Post('mfa/challenge')
  @HttpCode(HttpStatus.OK)
  async verifyMfaChallenge(@Body() dto: { mfaChallengeToken: string; code: string }) {
    return this.authService.verifyMfaChallenge(dto.mfaChallengeToken, dto.code);
  }

  // POST /auth/refresh - Rotate refresh token
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshSession(
    @Body() dto: { refreshToken: string; deviceFingerprint?: string },
  ) {
    return this.authService.refreshSession(dto.refreshToken, dto.deviceFingerprint);
  }

  // POST /auth/logout - Revoke refresh token
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: { refreshToken: string }) {
    return this.authService.logout(dto.refreshToken);
  }

  // GET /auth/me - Get own profile
  @Get('me')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.INSTRUCTOR, Role.PROCTOR, Role.GRADER, Role.CANDIDATE, Role.OBSERVER)
  async getProfile(
    @CurrentUser() user: any,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.authService.getProfile(user.sub, tenantId);
  }
}
