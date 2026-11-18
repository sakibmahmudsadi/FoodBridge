import { IsOptional, IsUUID } from 'class-validator';

export class ApproveDonorDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
