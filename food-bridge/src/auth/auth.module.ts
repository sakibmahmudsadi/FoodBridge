import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { NgoProfileModule } from '../ngo-profile/ngo-profile.module.js';
import { DonorProfileModule } from '../donor-profile/donor-profile.module.js';
import { VolunteerProfileModule } from '../volunteer-profile/volunteer-profile.module.js';

@Module({
  imports: [UsersModule,NgoProfileModule,DonorProfileModule,VolunteerProfileModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
