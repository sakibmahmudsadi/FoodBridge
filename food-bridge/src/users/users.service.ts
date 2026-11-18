import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity.js';
import { EntityManager, Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { LoginDto } from '../auth/dto/login.dto.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ){}

    async createUser(manager: EntityManager,dto:RegisterDto): Promise<User> {
        const userRepository = manager.getRepository(User);
        const user = userRepository.create(dto);
        return userRepository.save(user);
    }

    async findUser(dto:LoginDto): Promise<User | null>{
        const emailOrPhone = dto.emailOrPhone;

        return this.userRepository.findOne({
            where: [
                { email: emailOrPhone },
                { phone: emailOrPhone },
            ],
        });
    }

    async getUserInfo(userId:string):Promise<User|null>{
        return this.userRepository.findOne({
            where: { userId },
            relations: {
                donorProfile: true,
                ngoProfile: true,
                volunteerProfile: true,
            },
            select: {
                userId: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                donorProfile: true,
                ngoProfile: true,
                volunteerProfile: true,
            },
        });
    }
}
