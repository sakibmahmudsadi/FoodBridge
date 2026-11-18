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

@Controller('delivery-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryRecordsController {
  constructor(
    private readonly deliveryRecordsService: DeliveryRecordsService,
  ) {}

  @Post(':id/confirm')
  @HttpCode(200)
  @Roles(UserRole.NGO)
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliveryRecordsService.confirm(user.userID, id);
  }

  @Post(':id/dispute')
  @HttpCode(200)
  @Roles(UserRole.NGO)
  dispute(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisputeDeliveryDto,
  ) {
    return this.deliveryRecordsService.dispute(user.userID, id, dto);
  }
}
