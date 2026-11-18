import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DonationUnit } from '../donation-unit.enum.js';

export class CreateDonationDto {
  @IsUUID()
  categoryId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @Matches(/^\d{1,8}(\.\d{1,2})?$/, {
    message:
      'quantity must be a decimal string with at most two decimal places.',
  })
  quantity: string;

  @IsEnum(DonationUnit)
  unit: DonationUnit;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  area: string;

  @IsDateString({ strict: true })
  availableFrom: string;

  @IsDateString({ strict: true })
  pickupDeadline: string;

  @IsDateString({ strict: true })
  declaredUseByAt: string;
}
