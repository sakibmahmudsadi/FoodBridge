import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { NgoProfileModule } from '../ngo-profile/ngo-profile.module.js';
import { DonorProfileModule } from '../donor-profile/donor-profile.module.js';
import { VolunteerProfileModule } from '../volunteer-profile/volunteer-profile.module.js';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt.guards.js';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from '../common/roles.guard.js';

@Global()
@Module({
  imports: [
    UsersModule,
    NgoProfileModule,
    DonorProfileModule,
    VolunteerProfileModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.getOrThrow<string>('JWT_EXPIRY') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard]
})
export class AuthModule {}
