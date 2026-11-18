import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { DonorDto } from './dto/donor-register.dto.js';
import { NgoDto } from './dto/ngo-register.dto.js';
import { VolunteerDto } from './dto/volunteer-register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt.guards.js';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
    user: {
        userID: string;
        userRole: string;
    };
};

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

    @Post("login")
    login(@Body() dto:LoginDto){
        return this.authService.login(dto);
    }

    @Get('about-me')
    @UseGuards(JwtAuthGuard)
    aboutMe(@Req() request: AuthenticatedRequest){
        return request.user;
    }
}
