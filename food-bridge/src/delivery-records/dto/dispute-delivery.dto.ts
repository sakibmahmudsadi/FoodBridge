import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DisputeDeliveryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
