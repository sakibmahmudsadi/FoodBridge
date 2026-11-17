import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorCatalogueAuthModule } from '../donor-catalogue-auth/donor-catalogue-auth.module.js';
import { FoodCategory } from './entities/food-category.entity.js';
import { FoodCategoriesController } from './food-categories.controller.js';
import { FoodCategoriesService } from './food-categories.service.js';

@Module({
  imports: [DonorCatalogueAuthModule, TypeOrmModule.forFeature([FoodCategory])],
  controllers: [FoodCategoriesController],
  providers: [FoodCategoriesService],
})
export class FoodCategoriesModule {}
