import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../common/user-role.enum.js';

export type AuthenticatedUser = {
    userId: string;
    userRole: UserRole;
};

export const CurrentUser = createParamDecorator(
    (_data:unknown, context: ExecutionContext): AuthenticatedUser => {
        const request = context.switchToHttp().getRequest();
        return request.user;
    },
);
