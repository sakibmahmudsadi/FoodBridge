import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '../common/user-role.enum.js';
import { JwtAuthGuard } from '../donor-catalogue-auth/jwt-auth.guard.js';
import { Roles } from '../donor-catalogue-auth/roles.decorator.js';
import { RolesGuard } from '../donor-catalogue-auth/roles.guard.js';
import { ApproveDonorDto } from './dtos/approve-donor.dto.js';
import { OrganizationsService } from './organizations.service.js';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post('donors/:userId/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  approveDonor(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ApproveDonorDto,
  ) {
    return this.organizationsService.approveDonor(userId, dto.organizationId);
  }
}
