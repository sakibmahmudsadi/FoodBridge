import { Injectable, NotFoundException } from '@nestjs/common';
import { DonorProfile } from './entities/donor-profile.entity.js';
import { EntityManager } from 'typeorm';
import { UpdateDonorDto } from '../auth/dto/update-donor.dto.js';

@Injectable()
export class DonorProfileService {
  async createProfile(
    manager: EntityManager,
    userId: string,
    address: string
  ): Promise<DonorProfile> {
    const donorRepository = manager.getRepository(DonorProfile);

    const profile = donorRepository.create({
      userId,
      address,
    });

    return donorRepository.save(profile);
  }

  async updateDonor(manager:EntityManager, userId:string,
    dto:UpdateDonorDto):Promise<DonorProfile>{
    const donorRepository = manager.getRepository(DonorProfile);
    const profile = await donorRepository.findOne({where:{userId}});
    if (!profile) {
            throw new NotFoundException(`Donor not found!`);
        }
    if (dto.address !== undefined) {
      profile.address = dto.address;
    }

    return donorRepository.save(profile);
  }
}
