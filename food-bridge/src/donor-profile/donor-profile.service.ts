import { Injectable } from '@nestjs/common';
import { DonorProfile } from './entities/donor-profile.entity.js';
import { EntityManager } from 'typeorm';

@Injectable()
export class DonorProfileService {
  async createProfile(
    manager: EntityManager,
    userId: string,
    address: string,
  ): Promise<DonorProfile> {
    // Use the transaction manager passed by AuthService so this profile save
    // commits or rolls back together with the user save.
    const donorRepository = manager.getRepository(DonorProfile);

    // The profile stores only donor-specific information and the shared user ID.
    const profile = donorRepository.create({
      userId,
      address,
    });

    return donorRepository.save(profile);
  }
}
