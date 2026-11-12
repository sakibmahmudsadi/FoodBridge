import { IsBoolean, IsEmail, IsEnum, IsIn, IsNotEmpty, IsString, MinLength } from "class-validator";
import { UserRole } from "../../common/user-role.enum.js";

export class RegisterDto{
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsEmail()
    @IsNotEmpty()
    email:string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password:string;

    @IsEnum(UserRole)
    @IsIn([UserRole.DONOR, UserRole.NGO, UserRole.VOLUNTEER])
    role:UserRole;

}