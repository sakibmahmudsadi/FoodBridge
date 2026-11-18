import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { VolunteerProfile } from './entities/volunteer-profile.entity.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class VolunteerProfileService {
    
    constructor(
            @InjectRepository(VolunteerProfile) private readonly volunteerRepository: Repository<VolunteerProfile>
        ){}

    async createProfile(manager:EntityManager,userId:string,address:string):Promise<VolunteerProfile>{
        const volunteerRepository= manager.getRepository(VolunteerProfile);
        const profile=volunteerRepository.create({
            userId,address
        });

        return volunteerRepository.save(profile);
    }

}
