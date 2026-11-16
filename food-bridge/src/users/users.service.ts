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

    // async createUser(userData: Partial<User>): Promise<User> {
    //     const user = this.userRepository.create(userData);
    //     return this.userRepository.save(user);
    // }

    async createUser(manager: EntityManager,dto:RegisterDto): Promise<User> {
        const userRepository = manager.getRepository(User);
        const user = userRepository.create(dto);
        return userRepository.save(user);
    }

    async findUser(dto:LoginDto): Promise<User | null>{
        const emailOrPhone = dto.emailOrPhone;

        // TypeORM treats the where array as OR, so this checks both fields.
        return this.userRepository.findOne({
            where: [
                { email: emailOrPhone },
                { phone: emailOrPhone },
            ],
        });
    }
}
