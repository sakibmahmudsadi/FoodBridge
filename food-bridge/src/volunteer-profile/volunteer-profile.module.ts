import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerProfile } from './entities/volunteer-profile.entity.js';
import { VolunteerProfileService } from './volunteer-profile.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([VolunteerProfile])],
  providers: [VolunteerProfileService],
  exports:[VolunteerProfileService]
})
export class VolunteerProfileModule {}
