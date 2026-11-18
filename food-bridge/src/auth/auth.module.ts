import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { NgoProfileModule } from '../ngo-profile/ngo-profile.module.js';
import { DonorProfileModule } from '../donor-profile/donor-profile.module.js';
import { VolunteerProfileModule } from '../volunteer-profile/volunteer-profile.module.js';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt.guards.js';

@Module({
  imports: [UsersModule,NgoProfileModule,DonorProfileModule,VolunteerProfileModule,
    JwtModule.register({
      secret: "test01",
      signOptions:{expiresIn:"1h"}
    }),PassportModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard]
})
export class AuthModule {}
