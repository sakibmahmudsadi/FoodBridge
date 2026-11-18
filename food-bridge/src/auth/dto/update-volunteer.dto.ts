import { IsIn, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { UpdateProfileDto } from "./update-profile.dto.js";

export class UpdateVolunteerDto extends UpdateProfileDto {
    @IsOptional()
    @IsIn(['AVAILABLE', 'UNAVAILABLE'])
    @ApiPropertyOptional({ enum: ['AVAILABLE', 'UNAVAILABLE'], example: 'AVAILABLE' })
    availability?: string;
}
