import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NgoVolunteer } from './entities/ngo-volunteer.entity.js';
import { NgoProfile } from '../ngo-profile/entities/ngo-profile.entity.js';
import { VolunteerProfile } from '../volunteer-profile/entities/volunteer-profile.entity.js';
import { NgoVolunteersService } from './ngo-volunteers.service.js';
import { NgoVolunteersController } from './ngo-volunteers.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([NgoVolunteer, NgoProfile, VolunteerProfile]),
  ],
  controllers: [NgoVolunteersController],
  providers: [NgoVolunteersService],
  exports: [NgoVolunteersService],
})
export class NgoVolunteersModule {}
