import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { NgoProfileModule } from '../ngo-profile/ngo-profile.module.js';
import { DonorProfileModule } from '../donor-profile/donor-profile.module.js';
import { VolunteerProfileModule } from '../volunteer-profile/volunteer-profile.module.js';
import { DonorCatalogueAuthModule } from '../donor-catalogue-auth/donor-catalogue-auth.module.js';
import { JwtAuthGuard } from './guards/jwt.guards.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    UsersModule,
    NgoProfileModule,
    DonorProfileModule,
    VolunteerProfileModule,
    DonorCatalogueAuthModule,
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
})
export class AuthModule {}
