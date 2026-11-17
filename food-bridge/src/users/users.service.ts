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

    async updateUser(
        manager: EntityManager,
        userId: string,
        changes: { name?: string; phone?: string },
    ): Promise<void> {
        const data: { name?: string; phone?: string } = {};
        if (changes.name !== undefined) data.name = changes.name;
        if (changes.phone !== undefined) data.phone = changes.phone;
        if (Object.keys(data).length === 0) return;
        await manager.getRepository(User).update({ userId }, data);
    }

    async softDeleteUser(manager: EntityManager, userId: string): Promise<void> {
        await manager.getRepository(User).softDelete({ userId });
    }
}
