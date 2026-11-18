import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { NgoProfile } from './entities/ngo-profile.entity.js';

@Injectable()
export class NgoProfileService {
    async createProfile(manager:EntityManager,userId:string,regNo:string,address:string):Promise<NgoProfile>{
        const ngoRepository= manager.getRepository(NgoProfile);
        const profile=ngoRepository.create({
            userId,regNo,address
        });

        return ngoRepository.save(profile);
    }
}
