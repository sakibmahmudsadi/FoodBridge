import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    emailOrPhone: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
