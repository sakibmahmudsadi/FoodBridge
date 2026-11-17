import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, type Repository } from 'typeorm';
import type { CreateFoodCategoryDto } from './dtos/create-food-category.dto.js';
import type { UpdateFoodCategoryDto } from './dtos/update-food-category.dto.js';
import { FoodCategory } from './entities/food-category.entity.js';

@Injectable()
export class FoodCategoriesService {
  constructor(
    @InjectRepository(FoodCategory)
    private readonly categoryRepository: Repository<FoodCategory>,
  ) {}

  async createCategory(dto: CreateFoodCategoryDto): Promise<FoodCategory> {
    const category = this.categoryRepository.create(dto);
    return this.saveCategory(this.categoryRepository, category);
  }

  async getAllCategories(page: number, limit: number) {
    const skip = (page - 1) * limit;
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger(skip)
    ) {
      throw new BadRequestException('Use page >= 1 and a limit from 1 to 100.');
    }

    const [data, total] = await this.categoryRepository.findAndCount({
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return { data, page, limit, total };
  }

  async getCategoryById(id: string): Promise<FoodCategory> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Food category not found.');
    }

    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateFoodCategoryDto,
  ): Promise<FoodCategory> {
    return this.categoryRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(FoodCategory);
      const category = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!category) {
        throw new NotFoundException('Food category not found.');
      }

      return this.saveCategory(repository, repository.merge(category, dto));
    });
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      const result = await this.categoryRepository.delete(id);
      if (!result.affected) {
        throw new NotFoundException('Food category not found.');
      }
    } catch (error) {
      const code =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string }).code
          : undefined;
      if (code === '23001' || code === '23503') {
        throw new ConflictException('This category is used by a donation.');
      }

      throw error;
    }
  }

  private async saveCategory(
    repository: Repository<FoodCategory>,
    category: FoodCategory,
  ): Promise<FoodCategory> {
    try {
      return await repository.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'A food category with this name already exists.',
        );
      }

      throw error;
    }
  }
}
