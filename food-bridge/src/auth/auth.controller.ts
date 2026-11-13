import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { DonorDto } from './dto/donor-register.dto.js';
import { NgoDto } from './dto/ngo-register.dto.js';
import { VolunteerDto } from './dto/volunteer-register.dto.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}

    @Post('register/donor')
    registerDonor(@Body() dto:DonorDto){
        return this.authService.registerDonor(dto);
    }

    @Post('register/ngo')
    registerNgo(@Body() dto:NgoDto){
        return this.authService.registerNgo(dto);
    }

    @Post('register/volunteer')
    registerVolunteer(@Body() dto:VolunteerDto){
        return this.authService.registerVolunteer(dto);
    }
}
