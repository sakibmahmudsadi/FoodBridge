import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, Matches, Max, Min, ValidateNested } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleSlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm (24h)' })
  startTime: string;

  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm (24h)' })
  endTime: string;
}

export class ReplaceScheduleDto {
  @IsArray()
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  slots: ScheduleSlotDto[];
}
