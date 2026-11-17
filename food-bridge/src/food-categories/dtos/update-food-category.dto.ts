import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, ValidateIf } from 'class-validator';
import { CreateFoodCategoryDto } from './create-food-category.dto.js';

export class UpdateFoodCategoryDto extends PartialType(CreateFoodCategoryDto, {
  skipNullProperties: false,
}) {
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
