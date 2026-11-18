import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelReservationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
