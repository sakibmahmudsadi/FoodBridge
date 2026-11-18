import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';
import { AssignmentsService } from '../assignments/assignments.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { CancelReservationDto } from './dto/cancel-reservation.dto.js';
import { QueryReservationsDto } from './dto/query-reservations.dto.js';
import { OfferAssignmentDto } from '../assignments/dto/offer-assignment.dto.js';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Post()
  @Roles(UserRole.NGO)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(user.userID, dto);
  }

  @Get()
  @Roles(UserRole.NGO, UserRole.DONOR, UserRole.ADMIN)
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryReservationsDto) {
    return this.reservationsService.findAll(user, query);
  }

  @Get(':id')
  @Roles(UserRole.NGO, UserRole.DONOR, UserRole.ADMIN)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reservationsService.findOne(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @Roles(UserRole.NGO)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelReservationDto,
  ) {
    return this.reservationsService.cancel(user.userID, id, dto);
  }

  @Post(':id/assignments')
  @Roles(UserRole.NGO)
  offerAssignment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OfferAssignmentDto,
  ) {
    return this.assignmentsService.offer(user.userID, id, dto);
  }
}
