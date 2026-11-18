import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor.js';
import { UserRole } from '../common/user-role.enum.js';
import { JwtAuthGuard } from '../donor-catalogue-auth/jwt-auth.guard.js';
import { Roles } from '../donor-catalogue-auth/roles.decorator.js';
import { RolesGuard } from '../donor-catalogue-auth/roles.guard.js';
import { CreateFoodCategoryDto } from './dtos/create-food-category.dto.js';
import { UpdateFoodCategoryDto } from './dtos/update-food-category.dto.js';
import { FoodCategoriesService } from './food-categories.service.js';

@Controller('food-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
export class FoodCategoriesController {
  constructor(private readonly foodCategoriesService: FoodCategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  createCategory(@Body() dto: CreateFoodCategoryDto) {
    return this.foodCategoriesService.createCategory(dto);
  }

  @Get()
  getAllCategories(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.foodCategoriesService.getAllCategories(page, limit);
  }

  @Get(':id')
  getCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodCategoriesService.getCategoryById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFoodCategoryDto,
  ) {
    return this.foodCategoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodCategoriesService.deleteCategory(id);
  }
}
