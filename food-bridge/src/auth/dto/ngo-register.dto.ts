import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// NGO role comes from the registration endpoint, so it is not in this DTO.
export class NgoDto {
    @ApiProperty({ example: 'Test NGO', description: 'Name of the NGO.' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '+8801812345678', description: 'Contact phone number.' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ example: 'ngo@example.com', description: 'Contact email address.' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'ExamplePass123', minLength: 8, description: 'Account password.' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'NGO-DHK-TEST-001', description: 'NGO registration number.' })
    regNo:string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Banani, Dhaka', description: 'NGO address.' })
    address: string;

}
