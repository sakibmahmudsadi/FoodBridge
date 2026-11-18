import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { UpdateProfileDto } from "./update-profile.dto.js";

// verificationStatus is intentionally not editable by the NGO.
export class UpdateNgoDto extends UpdateProfileDto {
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ example: 'NGO-DHK-TEST-002' })
    regNo?: string;

}
