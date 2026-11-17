import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '../common/user-role.enum.js';
import type { AuthenticatedRequest } from '../donor-catalogue-auth/authenticated-request.type.js';
import { JwtAuthGuard } from '../donor-catalogue-auth/jwt-auth.guard.js';
import { Roles } from '../donor-catalogue-auth/roles.decorator.js';
import { RolesGuard } from '../donor-catalogue-auth/roles.guard.js';
import { DonationsService } from './donations.service.js';
import { CreateDonationDto } from './dtos/create-donation.dto.js';

@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @Roles(UserRole.DONOR)
  createDraft(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateDonationDto,
  ) {
    return this.donationsService.createDraft(request.user.userID, dto);
  }
}
