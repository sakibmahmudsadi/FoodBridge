import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DonorProfileService } from '../donor-profile/donor-profile.service.js';
import { UserRole } from '../common/user-role.enum.js';
import { DonorDto } from './dto/donor-register.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly dataSource: DataSource,
    private readonly donorProfileService: DonorProfileService,
  ) {}

  async registerDonor(dto: DonorDto) {
    // Keep both inserts in one transaction so a failed profile insert also
    // rolls back the user insert.
    return this.dataSource.transaction(async (manager) => {
      // The registration endpoint decides the role; don't trust dto.role.
      const user = await this.userService.createUser(manager, {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: dto.password,
        role: UserRole.DONOR
      });

      // The saved user now has its generated ID. Use it with the donor address.
      const profile = await this.donorProfileService.createProfile(
        manager, user.userId,
        dto.address,
      );

      // Return safe account fields only; never return the password.
      return {
        message: 'Registration successful.',
        user: {
          id: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
        profile,
      };
    });
  }

  async registerNgo(dto:)
}
