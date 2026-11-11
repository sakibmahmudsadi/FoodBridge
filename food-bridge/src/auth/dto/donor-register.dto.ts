import { IsNotEmpty, IsString } from "class-validator";
import { RegisterDto } from "./register.dto.js";

export class DonorDto extends RegisterDto{

    @IsString()
    @IsNotEmpty()
    address: string;

}