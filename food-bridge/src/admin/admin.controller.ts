import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { UserRole } from '../common/user-role.enum.js';
import { AdminService } from './admin.service.js';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'User account soft-deleted.' })
  @ApiUnauthorizedResponse({ description: 'A valid JWT is required.' })
  @ApiForbiddenResponse({ description: 'Only admins can delete users.' })
  @ApiNotFoundResponse({ description: 'User was not found.' })
  deleteUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Patch('ngos/:userId/toggle-verification')
  @ApiOkResponse({ description: 'NGO verification status changed.' })
  @ApiUnauthorizedResponse({ description: 'A valid JWT is required.' })
  @ApiForbiddenResponse({ description: 'Only admins can verify NGOs.' })
  @ApiNotFoundResponse({ description: 'NGO user or profile was not found.' })
  toggleNgoVerification(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminService.toggleNgoVerification(userId);
  }
}
