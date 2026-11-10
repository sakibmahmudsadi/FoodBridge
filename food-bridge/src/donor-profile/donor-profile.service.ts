import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DonorProfile } from './entities/donor-profile.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class DonorProfileService {
    constructor(
        @InjectRepository(DonorProfile) private readonly donorProfileRepository: Repository<DonorProfile> 
    ){}
}
