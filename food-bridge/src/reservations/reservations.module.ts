import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity.js';
import { Donation } from '../donations/entities/donation.entity.js';
import { FoodCategory } from '../food-categories/entities/food-category.entity.js';
import { ReservationsService } from './reservations.service.js';
import { ReservationsController } from './reservations.controller.js';
import { NgoVolunteersModule } from '../ngo-volunteers/ngo-volunteers.module.js';
import { AssignmentsModule } from '../assignments/assignments.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Donation, FoodCategory]),
    NgoVolunteersModule,
    AssignmentsModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
