import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerProfile } from './entities/volunteer-profile.entity.js';
import { VolunteerProfileService } from './volunteer-profile.service.js';
import { VolunteerProfileController } from './volunteer-profile.controller.js';
import { VolunteerAvailability } from './entities/volunteer-availability.entity.js';
import { RolesGuard } from '../common/roles.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([VolunteerProfile, VolunteerAvailability]), UsersModule],
  controllers: [VolunteerProfileController],
  providers: [VolunteerProfileService, JwtAuthGuard, RolesGuard],
  exports:[VolunteerProfileService]
})
export class VolunteerProfileModule {}
