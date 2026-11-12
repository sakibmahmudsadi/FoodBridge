import { IsNotEmpty, IsString } from "class-validator";
import { RegisterDto } from "./register.dto.js";


export class NgoDto extends RegisterDto{

    @IsNotEmpty()
    @IsString()
    regNo:string;

    @IsString()
    @IsNotEmpty()
    address: string;

}