import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { UserRole } from '../common/user-role.enum.js';
import type { AuthenticatedRequest } from './authenticated-request.type.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = /^Bearer +(\S+)$/i.exec(
      request.headers.authorization ?? '',
    )?.[1];
    if (!token) {
      throw new UnauthorizedException('A bearer token is required.');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
      throw new ServiceUnavailableException(
        'JWT authentication is unavailable.',
      );
    }

    const user = await this.jwtService
      .verifyAsync<AuthenticatedRequest['user']>(token, {
        secret,
        algorithms: ['HS256'],
      })
      .catch(() => null);

    if (
      !user ||
      !isUUID(user.userID) ||
      !Object.values(UserRole).includes(user.userRole)
    ) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    request.user = { userID: user.userID, userRole: user.userRole };
    return true;
  }
}
