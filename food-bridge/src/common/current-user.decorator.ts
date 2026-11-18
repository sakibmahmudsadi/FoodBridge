import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from './user-role.enum.js';

export interface AuthUser {
  userId: string;
  userRole: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest<{ user: AuthUser }>().user;
  },
);
