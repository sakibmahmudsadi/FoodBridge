import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NgoVolunteersService } from './ngo-volunteers.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';
import { InviteVolunteerDto } from './dto/invite-volunteer.dto.js';
import { QueryNgoVolunteersDto } from './dto/query-ngo-volunteers.dto.js';

@Controller('ngo-volunteers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NgoVolunteersController {
  constructor(private readonly ngoVolunteersService: NgoVolunteersService) {}

  @Post()
  @Roles(UserRole.NGO)
  invite(@CurrentUser() user: AuthUser, @Body() dto: InviteVolunteerDto) {
    return this.ngoVolunteersService.invite(user.userID, dto);
  }

  @Get()
  @Roles(UserRole.NGO, UserRole.VOLUNTEER, UserRole.ADMIN)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryNgoVolunteersDto,
  ) {
    return this.ngoVolunteersService.findAll(user, query);
  }

  @Get(':id')
  @Roles(UserRole.NGO, UserRole.VOLUNTEER, UserRole.ADMIN)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ngoVolunteersService.findOne(user, id);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ngoVolunteersService.accept(user.userID, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  decline(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ngoVolunteersService.decline(user.userID, id);
  }

  @Delete(':id')
  @Roles(UserRole.NGO, UserRole.VOLUNTEER)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ngoVolunteersService.remove(user, id);
  }
}
