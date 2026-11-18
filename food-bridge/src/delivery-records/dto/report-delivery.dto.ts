import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ReportDeliveryDto {
  @Matches(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, {
    message: 'deliveredQuantity must be a positive decimal with at most 2 places',
  })
  deliveredQuantity: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  recipientName: string;
}
