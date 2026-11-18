import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeliveryRecordsService } from './delivery-records.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';
import { DisputeDeliveryDto } from './dto/dispute-delivery.dto.js';
import { ReportDeliveryDto } from './dto/report-delivery.dto.js';

@ApiTags('Delivery records')
@ApiBearerAuth('access-token')
@Controller('delivery-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryRecordsController {
  constructor(
    private readonly deliveryRecordsService: DeliveryRecordsService,
  ) {}

  @Post('assignments/:assignmentId/report')
  @HttpCode(201)
  @Roles(UserRole.VOLUNTEER)
  report(
    @CurrentUser() user: AuthUser,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: ReportDeliveryDto,
  ) {
    return this.deliveryRecordsService.report(user.userId, assignmentId, dto);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @Roles(UserRole.NGO)
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliveryRecordsService.confirm(user.userId, id);
  }

  @Post(':id/dispute')
  @HttpCode(200)
  @Roles(UserRole.NGO)
  dispute(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisputeDeliveryDto,
  ) {
    return this.deliveryRecordsService.dispute(user.userId, id, dto);
  }
}

