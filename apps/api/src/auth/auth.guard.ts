import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { DrizzleService } from '../db/drizzle.service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { IS_PUBLIC_KEY } from './public.decorator';

/** Routes that pending/rejected users may still hit (for frontend detection) */
const STATUS_EXEMPT_PATHS = ['/users/me', '/users/sync'];

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly drizzle: DrizzleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip auth for @Public() routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'] as string | undefined;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    (request as any).user = { id: userId.trim() };

    // Check user approval status (skip for exempt routes)
    const isExempt = STATUS_EXEMPT_PATHS.some((p) => request.path === p);
    if (!isExempt) {
      const [dbUser] = await this.drizzle.db
        .select({ status: users.status })
        .from(users)
        .where(eq(users.id, userId.trim()));

      if (dbUser?.status === 'pending') {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'PENDING_APPROVAL',
          message: 'Your account is pending approval.',
        });
      }
      if (dbUser?.status === 'rejected') {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'ACCOUNT_REJECTED',
          message: 'Your account has been rejected.',
        });
      }
    }

    return true;
  }
}
