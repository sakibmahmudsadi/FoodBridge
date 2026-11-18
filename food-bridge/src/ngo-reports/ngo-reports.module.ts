import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../reservations/entities/reservation.entity.js';
import { NgoVolunteer } from '../ngo-volunteers/entities/ngo-volunteer.entity.js';
import { CollectionAssignment } from '../assignments/entities/collection-assignment.entity.js';
import { DeliveryRecord } from '../delivery-records/entities/delivery-record.entity.js';
import { NgoReportsService } from './ngo-reports.service.js';
import { NgoReportsController } from './ngo-reports.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      NgoVolunteer,
      CollectionAssignment,
      DeliveryRecord,
    ]),
  ],
  controllers: [NgoReportsController],
  providers: [NgoReportsService],
})
export class NgoReportsModule {}
