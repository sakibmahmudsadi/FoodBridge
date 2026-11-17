import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { VolunteerProfileService } from './volunteer-profile.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';
import { ReplaceScheduleDto } from './dto/schedule.dto.js';
import { QueryAvailableDto, QueryVolunteersDto } from './dto/query-volunteers.dto.js';

@Controller('volunteers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VolunteerProfileController {
    constructor(private readonly service: VolunteerProfileService) {}

    // ----- volunteer (self) — keep these BEFORE the ':id' routes -----

    @Get('me')
    @Roles(UserRole.VOLUNTEER)
    getMe(@CurrentUser() user: AuthUser) {
        return this.service.findMe(user.userID);
    }

    @Patch('me')
    @Roles(UserRole.VOLUNTEER)
    updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateVolunteerDto) {
        return this.service.update(user.userID, dto);
    }

    @Delete('me')
    @Roles(UserRole.VOLUNTEER)
    deleteMe(@CurrentUser() user: AuthUser) {
        return this.service.remove(user.userID);
    }

    @Patch('me/availability')
    @Roles(UserRole.VOLUNTEER)
    setAvailability(@CurrentUser() user: AuthUser, @Body() dto: UpdateAvailabilityDto) {
        return this.service.setAvailability(user.userID, dto.availability);
    }

    @Get('me/schedule')
    @Roles(UserRole.VOLUNTEER)
    getMySchedule(@CurrentUser() user: AuthUser) {
        return this.service.getSchedule(user.userID);
    }

    @Put('me/schedule')
    @Roles(UserRole.VOLUNTEER)
    replaceMySchedule(@CurrentUser() user: AuthUser, @Body() dto: ReplaceScheduleDto) {
        return this.service.replaceSchedule(user.userID, dto);
    }

    // ----- NGO / admin -----

    @Get('available')
    @Roles(UserRole.NGO, UserRole.ADMIN)
    findAvailable(@Query() query: QueryAvailableDto) {
        return this.service.findAvailable(query);
    }

    @Get()
    @Roles(UserRole.NGO, UserRole.ADMIN)
    findAll(@Query() query: QueryVolunteersDto) {
        return this.service.findAll(query);
    }

    @Get(':id')
    @Roles(UserRole.NGO, UserRole.ADMIN)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.findOne(id);
    }

    @Get(':id/schedule')
    @Roles(UserRole.NGO, UserRole.ADMIN)
    getSchedule(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.getSchedule(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
