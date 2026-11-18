import { IsEmail, IsEnum, IsIn, IsNotEmpty, IsString, MinLength } from "class-validator";
import { UserRole } from "../../common/user-role.enum.js";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto{
    @ApiProperty({ example: 'Test User', description: 'Full name of the user.' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: '+8801712345678', description: 'Phone number.' })
    phone: string;

    @ApiProperty({ example: 'user@example.com', description: 'Email address.' })
    @IsEmail()
    @IsNotEmpty()
    email:string;

    @ApiProperty({ example: 'ExamplePass123', minLength: 8, description: 'Account password.' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password:string;

    @ApiProperty({ enum: [UserRole.DONOR, UserRole.NGO, UserRole.VOLUNTEER] })
    @IsEnum(UserRole)
    @IsIn([UserRole.DONOR, UserRole.NGO, UserRole.VOLUNTEER])
    role:UserRole;

}
