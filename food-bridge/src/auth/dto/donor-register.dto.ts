import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// Donor role comes from the registration endpoint, so don't require it
// in the request body. Keep the other shared registration fields.
export class DonorDto {
    @ApiProperty({ example: 'Test User', description: 'Full name of the donor.' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '+8801712345678', description: 'Phone number.' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ example: 'donor@example.com', description: 'Email address.' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'ExamplePass123', minLength: 8, description: 'Account password.' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Dhanmondi, Dhaka', description: 'Donor address.' })
    address: string;

}
