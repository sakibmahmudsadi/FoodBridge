import { IsNotEmpty, IsString } from "class-validator";
import { OmitType } from "@nestjs/mapped-types";
import { RegisterDto } from "./register.dto.js";


// NGO role comes from the registration endpoint, so don't require it
// in the request body. Keep the other shared registration fields.
export class NgoDto extends OmitType(RegisterDto, ['role'] as const){

    @IsNotEmpty()
    @IsString()
    regNo:string;

    @IsString()
    @IsNotEmpty()
    address: string;

}
