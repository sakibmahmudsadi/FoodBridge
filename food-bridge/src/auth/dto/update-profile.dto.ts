import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { UpdateUserDto } from "./update-user.dto.js";

// These fields are shared by all profile types.
export class UpdateProfileDto extends UpdateUserDto {
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ example: 'Dhanmondi, Dhaka' })
    address?: string;
}
