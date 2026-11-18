import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'Registered email or phone number.' })
    @IsString()
    @IsNotEmpty()
    emailOrPhone: string;

    @ApiProperty({ example: 'ExamplePass123', description: 'Account password.' })
    @IsString()
    @IsNotEmpty()
    password: string;
}
