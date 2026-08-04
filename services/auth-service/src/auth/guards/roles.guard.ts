import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/client/index.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Requirement: No implicit defaults, every protected endpoint must explicitly define allowed roles.
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException('Access denied: Route roles not explicitly declared');
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: User role undefined');
    }

    // SUPER_ADMIN can bypass institution checks if doing cross-tenant action,
    // but they must also be explicitly allowed in roles.
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied: Requires one of [${requiredRoles.join(', ')}]`);
    }

    return true;
  }
}
