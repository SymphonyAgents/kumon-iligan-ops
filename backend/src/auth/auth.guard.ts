import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { DrizzleService } from '../db/drizzle.service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

/** Routes that pending/rejected users may still hit (for frontend detection) */
const STATUS_EXEMPT_PATHS = ['/users/me', '/users/provision'];

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly drizzle: DrizzleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('Missing auth token');

    const { data, error } = await this.supabase.db.auth.getUser(token);

    if (error || !data.user) throw new UnauthorizedException('Invalid token');

    (request as Request & Record<string, unknown>).user = data.user;

    // Check user approval status (skip for exempt routes)
    const isExempt = STATUS_EXEMPT_PATHS.some((p) => request.path === p);
    if (!isExempt) {
      const [dbUser] = await this.drizzle.db
        .select({ status: users.status })
        .from(users)
        .where(eq(users.id, data.user.id));

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

  private extractToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
