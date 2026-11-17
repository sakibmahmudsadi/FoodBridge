import type { Request } from 'express';
import type { UserRole } from '../common/user-role.enum.js';

export type AuthenticatedRequest = Request & {
  user: {
    userID: string;
    userRole: UserRole;
  };
};
