import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorCatalogueAuthModule } from '../donor-catalogue-auth/donor-catalogue-auth.module.js';
import { DonorProfile } from '../donor-profile/entities/donor-profile.entity.js';
import { FoodCategory } from '../food-categories/entities/food-category.entity.js';
import { Reservation } from '../reservations/entities/reservation.entity.js';
import { DonationsController } from './donations.controller.js';
import { DonationsService } from './donations.service.js';
import { Donation } from './entities/donation.entity.js';

@Module({
  imports: [
    DonorCatalogueAuthModule,
    TypeOrmModule.forFeature([
      Donation,
      FoodCategory,
      DonorProfile,
      Reservation,
    ]),
  ],
  controllers: [DonationsController],
  providers: [DonationsService],
})
export class DonationsModule {}
