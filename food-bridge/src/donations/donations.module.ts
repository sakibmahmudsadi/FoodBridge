import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { FoodCategory } from '../food-categories/entities/food-category.entity.js';
import { Reservation } from '../reservations/entities/reservation.entity.js';
import { DonationsController } from './donations.controller.js';
import { DonationsService } from './donations.service.js';
import { Donation } from './entities/donation.entity.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Donation,
      FoodCategory,
      Reservation,
    ]),
  ],
  controllers: [DonationsController],
  providers: [DonationsService],
})
export class DonationsModule {}
