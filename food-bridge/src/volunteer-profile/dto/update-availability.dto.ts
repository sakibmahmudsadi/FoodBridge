import { IsEnum } from 'class-validator';
import { AvailabilityStatus } from '../../common/availability-status.enum.js';

export class UpdateAvailabilityDto {
  @IsEnum(AvailabilityStatus)
  availability: AvailabilityStatus;
}
