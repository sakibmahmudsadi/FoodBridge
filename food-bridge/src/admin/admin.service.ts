import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '../common/user-role.enum.js';
import { NgoProfile } from '../ngo-profile/entities/ngo-profile.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  // Soft-delete a user account by its ID.
  async deleteUser(userId: string) {
    await this.usersService.softDeleteUser(userId);
    return { message: 'User deleted successfully.' };
  }

  // Switch an NGO between verified and pending (inactive) status.
  async toggleNgoVerification(userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { userId, role: UserRole.NGO },
      });
      if (!user) {
        throw new NotFoundException('NGO user not found.');
      }

      const profile = await manager.findOne(NgoProfile, { where: { userId } });
      if (!profile) {
        throw new NotFoundException('NGO profile not found.');
      }

      profile.verificationStatus =
        profile.verificationStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
      await manager.save(profile);

      return {
        message: 'NGO verification status updated.',
        userId,
        verificationStatus: profile.verificationStatus,
      };
    });
  }
}
