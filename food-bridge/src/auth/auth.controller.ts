import { Body, Controller, Delete, ForbiddenException, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { DonorDto } from './dto/donor-register.dto.js';
import { NgoDto } from './dto/ngo-register.dto.js';
import { VolunteerDto } from './dto/volunteer-register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt.guards.js';
import { UpdateDonorDto } from './dto/update-donor.dto.js';
import { UserRole } from '../common/user-role.enum.js';
import { UpdateNgoDto } from './dto/update-ngo.dto.js';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { AuthenticatedUser } from './decorators/current-user.decorator.js';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}

    // Admin bootstrap registration is disabled after creating the first admin.

    @Post('register/donor')
    @ApiOperation({ summary: 'Register a donor account and profile.' })
    @ApiCreatedResponse({ description: 'Donor account and profile created.' })
    @ApiBadRequestResponse({ description: 'The request body is invalid.' })
    registerDonor(@Body() dto:DonorDto){
        return this.authService.registerDonor(dto);
    }

    @Post('register/ngo')
    @ApiOperation({ summary: 'Register an NGO account and profile.' })
    @ApiCreatedResponse({ description: 'NGO account and profile created.' })
    @ApiBadRequestResponse({ description: 'The request body is invalid.' })
    registerNgo(@Body() dto:NgoDto){
        return this.authService.registerNgo(dto);
    }

    @Post('register/volunteer')
    @ApiOperation({ summary: 'Register a volunteer account and profile.' })
    @ApiCreatedResponse({ description: 'Volunteer account and profile created.' })
    @ApiBadRequestResponse({ description: 'The request body is invalid.' })
    registerVolunteer(@Body() dto:VolunteerDto){
        return this.authService.registerVolunteer(dto);
    }

    @Post("login")
    @ApiOperation({ summary: 'Log in with an email address or phone number.' })
    @ApiCreatedResponse({ description: 'JWT access token returned.' })
    @ApiUnauthorizedResponse({ description: 'Credentials are incorrect.' })
    login(@Body() dto:LoginDto){
        return this.authService.login(dto);
    }

    /*Auth guard testing*/
    @Get('about-me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get the authenticated user and their profile.' })
    @ApiOkResponse({ description: 'Authenticated user and matching profile returned.' })
    @ApiUnauthorizedResponse({ description: 'A valid JWT is required.' })
    getUserInfo(@CurrentUser() user: AuthenticatedUser){
        return this.authService.getUserInfo(user.userId);
    }

    @Delete('account')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Soft-delete the authenticated user account.' })
    @ApiOkResponse({ description: 'Account soft-deleted.' })
    @ApiUnauthorizedResponse({ description: 'A valid JWT is required.' })
    deleteAccount(@CurrentUser() user: AuthenticatedUser){
        return this.authService.deleteAccount(user.userId);
    }

    @Patch('donor-profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update the authenticated donor account and profile.' })
    @ApiOkResponse({ description: 'Donor account and profile updated.' })
    @ApiBadRequestResponse({ description: 'The request body is invalid.' })
    @ApiUnauthorizedResponse({ description: 'A valid JWT is required.' })
    @ApiForbiddenResponse({ description: 'Only donors can use this endpoint.' })
    updateDonor(@CurrentUser() user: AuthenticatedUser,@Body() dto:UpdateDonorDto){
        if(user.userRole === UserRole.DONOR){
        return this.authService.updateDonor(user.userId,dto);
        }
        throw new ForbiddenException("You are not a donor!");
    }

    @Patch('ngo-profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update the authenticated NGO account and profile.' })
    @ApiOkResponse({ description: 'NGO account and profile updated.' })
    @ApiBadRequestResponse({ description: 'The request body is invalid.' })
    @ApiUnauthorizedResponse({ description: 'A valid JWT is required.' })
    @ApiForbiddenResponse({ description: 'Only NGOs can use this endpoint.' })
    updateNgo(@CurrentUser() user: AuthenticatedUser,@Body() dto:UpdateNgoDto){
        if(user.userRole === UserRole.NGO){
        return this.authService.updateNgo(user.userId,dto);
        }
        throw new ForbiddenException("You are not an NGO!");
    }

    @Patch('volunteer-profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update the authenticated volunteer account and profile.' })
    @ApiOkResponse({ description: 'Volunteer account and profile updated.' })
    @ApiBadRequestResponse({ description: 'The request body is invalid.' })
    @ApiUnauthorizedResponse({ description: 'A valid JWT is required.' })
    @ApiForbiddenResponse({ description: 'Only volunteers can use this endpoint.' })
    updateVolunteer(@CurrentUser() user: AuthenticatedUser,@Body() dto:UpdateVolunteerDto){
        if(user.userRole === UserRole.VOLUNTEER){
        return this.authService.updateVolunteer(user.userId,dto);
        }
        throw new ForbiddenException("You are not a volunteer!");
    }

}
