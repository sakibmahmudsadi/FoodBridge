import { PartialType } from '@nestjs/mapped-types';
import { CreateDonationDto } from './create-donation.dto.js';

export class UpdateDonationDto extends PartialType(CreateDonationDto, {
  skipNullProperties: false,
}) {}
