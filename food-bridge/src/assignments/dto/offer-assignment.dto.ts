import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class OfferAssignmentDto {
  @IsUUID()
  membershipId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
