import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionAssignment } from './entities/collection-assignment.entity.js';
import { Reservation } from '../reservations/entities/reservation.entity.js';
import { AssignmentsService } from './assignments.service.js';
import { AssignmentsController } from './assignments.controller.js';
import { NgoVolunteersModule } from '../ngo-volunteers/ngo-volunteers.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionAssignment, Reservation]),
    NgoVolunteersModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
