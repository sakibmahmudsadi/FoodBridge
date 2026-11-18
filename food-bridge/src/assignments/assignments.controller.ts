import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';
import { QueryAssignmentsDto } from './dto/query-assignments.dto.js';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @Roles(UserRole.NGO, UserRole.VOLUNTEER, UserRole.ADMIN)
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryAssignmentsDto) {
    return this.assignmentsService.findAll(user, query);
  }

  @Get(':id')
  @Roles(UserRole.NGO, UserRole.VOLUNTEER, UserRole.ADMIN)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.findOne(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @Roles(UserRole.NGO)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.cancel(user.userID, id);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.accept(user.userID, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  decline(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.decline(user.userID, id);
  }

  @Post(':id/pickup')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  recordPickup(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.recordPickup(user.userID, id);
  }
}
