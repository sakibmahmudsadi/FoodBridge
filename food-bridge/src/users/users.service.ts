import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity.js';
import { EntityManager, Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { LoginDto } from '../auth/dto/login.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from '../auth/dto/update-user.dto.js';

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

    async updateUser (manager:EntityManager,userId:string,dto:UpdateUserDto):Promise<User>{
        const userRepository = manager.getRepository(User);
        const user = await userRepository.findOne({where:{userId}});
        if (!user) {
            throw new NotFoundException(`User not found!`);
        }

        if (dto.email !== undefined) user.email = dto.email;
        if (dto.phone !== undefined) user.phone = dto.phone;
        if (dto.name !== undefined) user.name = dto.name;
        
        return userRepository.save(user);
    }

    async softDeleteUser(userId:string,manager?:EntityManager):Promise<void>{
        const repository = manager ? manager.getRepository(User) : this.userRepository;
        const result = await repository.softDelete({userId});

        if (!result.affected) {
            throw new NotFoundException('User not found!');
        }
    }
 
}
