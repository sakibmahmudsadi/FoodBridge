import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { FoodCategory } from './entities/food-category.entity.js';
import { FoodCategoriesController } from './food-categories.controller.js';
import { FoodCategoriesService } from './food-categories.service.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([FoodCategory])],
  controllers: [FoodCategoriesController],
  providers: [FoodCategoriesService],
})
export class FoodCategoriesModule {}
