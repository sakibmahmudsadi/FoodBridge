import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor.js';
import { UserRole } from '../common/user-role.enum.js';
import type { AuthenticatedRequest } from '../donor-catalogue-auth/authenticated-request.type.js';
import { JwtAuthGuard } from '../donor-catalogue-auth/jwt-auth.guard.js';
import { Roles } from '../donor-catalogue-auth/roles.decorator.js';
import { RolesGuard } from '../donor-catalogue-auth/roles.guard.js';
import { DonationsService } from './donations.service.js';
import { CreateDonationDto } from './dtos/create-donation.dto.js';
import { DonationQueryDto } from './dtos/donation-query.dto.js';
import { UpdateDonationDto } from './dtos/update-donation.dto.js';

@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
@Roles(UserRole.DONOR)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  createDraft(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateDonationDto,
  ) {
    return this.donationsService.createDraft(request.user.userID, dto);
  }

  @Get()
  getDonations(
    @Req() request: AuthenticatedRequest,
    @Query() query: DonationQueryDto,
  ) {
    return this.donationsService.getDonations(request.user.userID, query);
  }

  @Get(':id')
  getDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.donationsService.getDonation(request.user.userID, id);
  }

  @Patch(':id')
  updateDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDonationDto,
  ) {
    return this.donationsService.updateDonation(request.user.userID, id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  publishDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.donationsService.publishDonation(request.user.userID, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  withdrawDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.donationsService.withdrawDonation(request.user.userID, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  archiveDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.donationsService.archiveDonation(request.user.userID, id);
  }
}
