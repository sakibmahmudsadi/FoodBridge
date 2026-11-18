import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AvailabilityStatus } from '../../common/availability-status.enum.js';

export class QueryVolunteersDto {
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability?: AvailabilityStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

export class QueryAvailableDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day: number;

  /** HH:mm */
  @IsOptional()
  time?: string;
}
