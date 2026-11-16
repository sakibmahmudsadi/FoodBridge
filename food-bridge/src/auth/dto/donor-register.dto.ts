import { IsNotEmpty, IsString } from "class-validator";
import { OmitType } from "@nestjs/mapped-types";
import { RegisterDto } from "./register.dto.js";

// Donor role comes from the registration endpoint, so don't require it
// in the request body. Keep the other shared registration fields.
export class DonorDto extends OmitType(RegisterDto, ['role'] as const){

    @IsString()
    @IsNotEmpty()
    address: string;

}
