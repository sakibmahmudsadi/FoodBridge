import { IsEmail, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

// These fields belong to the shared users table.
export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ example: 'Updated Name' })
    name?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ example: '+8801712345678' })
    phone?: string;

    @IsOptional()
    @IsEmail()
    @ApiPropertyOptional({ example: 'updated@example.com' })
    email?: string;
}
