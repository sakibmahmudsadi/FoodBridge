import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { NgoProfile } from './entities/ngo-profile.entity.js';
import { UpdateNgoDto } from '../auth/dto/update-ngo.dto.js';

@Injectable()
export class NgoProfileService {
    async createProfile(manager:EntityManager,userId:string,regNo:string,address:string):Promise<NgoProfile>{
        const ngoRepository= manager.getRepository(NgoProfile);
        const profile=ngoRepository.create({
            userId,regNo,address
        });

        return ngoRepository.save(profile);
    }

    async updateProfile(manager:EntityManager,userId:string,dto:UpdateNgoDto):Promise<NgoProfile>{
        const ngoRepository = manager.getRepository(NgoProfile);
        const profile = await ngoRepository.findOne({where:{userId}});

        if (!profile) {
            throw new NotFoundException('NGO profile not found!');
        }

        if (dto.regNo !== undefined) profile.regNo = dto.regNo;
        if (dto.address !== undefined) profile.address = dto.address;

        return ngoRepository.save(profile);
    }
}
