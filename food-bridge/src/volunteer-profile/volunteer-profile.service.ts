import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { VolunteerProfile } from './entities/volunteer-profile.entity.js';

@Injectable()
export class VolunteerProfileService {
    async createProfile(manager:EntityManager,userId:string,address:string):Promise<VolunteerProfile>{
        const volunteerRepository= manager.getRepository(VolunteerProfile);
        const profile=volunteerRepository.create({
            userId,address
        });

        return volunteerRepository.save(profile);
    }
}
