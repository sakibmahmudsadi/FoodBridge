import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DonorProfileService } from '../donor-profile/donor-profile.service.js';
import { UserRole } from '../common/user-role.enum.js';
import { DonorDto } from './dto/donor-register.dto.js';
import { UsersService } from '../users/users.service.js';
import { NgoDto } from './dto/ngo-register.dto.js';
import { NgoProfileService } from '../ngo-profile/ngo-profile.service.js';
import { VolunteerDto } from './dto/volunteer-register.dto.js';
import { VolunteerProfileService } from '../volunteer-profile/volunteer-profile.service.js';

import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';
import { UpdateDonorDto } from './dto/update-donor.dto.js';
import { UpdateNgoDto } from './dto/update-ngo.dto.js';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly dataSource: DataSource,
    private readonly donorProfileService: DonorProfileService,
    private readonly ngoProfileService: NgoProfileService,
    private readonly volunteerProfileService: VolunteerProfileService,
    private readonly jwt:JwtService
  ) {}

  async registerDonor(dto: DonorDto) {
    
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.dataSource.transaction(async (manager) => {
      
      const user = await this.userService.createUser(manager, {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: UserRole.DONOR
      });

      const profile = await this.donorProfileService.createProfile(
        manager, user.userId,
        dto.address,
      );

      return {
        message: 'Registration successful.',
        user: {
          id: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        profile: {
          userId: profile.userId,
          address: profile.address,
        },
      };
    });
  }

  async updateDonor(userId:string,dto: UpdateDonorDto){
    return this.dataSource.transaction(async (manager)=>{
      const user = await this.userService.updateUser(manager,userId,dto);
      const profile = await this.donorProfileService.updateDonor(manager,userId, dto);
      return {
        message: 'Update successful.',
        user: user && {
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        profile: {
          userId: profile.userId,
          address: profile.address,
        },
      };
    })
  }

  async updateNgo(userId:string,dto: UpdateNgoDto){
    return this.dataSource.transaction(async (manager)=>{
      const user = await this.userService.updateUser(manager,userId,dto);
      const profile = await this.ngoProfileService.updateProfile(manager,userId,dto);

      return {
        message: 'Update successful.',
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        profile: {
          userId: profile.userId,
          regNo: profile.regNo,
          address: profile.address,
          verificationStatus: profile.verificationStatus,
        },
      };
    });
  }

  async updateVolunteer(userId:string,dto: UpdateVolunteerDto){
    return this.dataSource.transaction(async (manager)=>{
      const user = await this.userService.updateUser(manager,userId,dto);
      const profile = await this.volunteerProfileService.updateProfile(manager,userId,dto);

      return {
        message: 'Update successful.',
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        profile: {
          userId: profile.userId,
          availability: profile.availability,
          address: profile.address,
        },
      };
    });
  }

  async deleteAccount(userId:string){
    await this.userService.softDeleteUser(userId);
    return { message: 'Account deleted successfully.' };
  }

  async registerNgo(dto:NgoDto){
      
    const hashedPassword = await bcrypt.hash(dto.password, 10);

      return await this.dataSource.transaction(
        async (manager)=>{
          const user = await this.userService.createUser(manager,{
            name:dto.name,
            phone:dto.phone,
            email:dto.email,
            password:hashedPassword,
            role:UserRole.NGO
          })

           const profile = await this.ngoProfileService.createProfile(manager,user.userId,dto.regNo,dto.address);

           return{
            message: 'Registration successful.',
            user: {
              id: user.userId,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
            },
            profile: {
              userId: profile.userId,
              regNo: profile.regNo,
              address: profile.address,
              verificationStatus: profile.verificationStatus,
            }}
        }
      )
  }

  async registerVolunteer(dto:VolunteerDto){
      
    const hashedPassword = await bcrypt.hash(dto.password, 10);

      return await this.dataSource.transaction(
        async (manager)=>{
          const user = await this.userService.createUser(manager,{
            name:dto.name,
            phone:dto.phone,
            email:dto.email,
            password:hashedPassword,
            role:UserRole.VOLUNTEER
          })

          const profile = await this.volunteerProfileService.createProfile(manager,user.userId,dto.address);

          return{
            message: 'Registration successful.',
            user: {
              id: user.userId,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
            },
            profile: {
              userId: profile.userId,
              availability: profile.availability,
              address: profile.address,
            }}
        }
      )
  }

  async login(dto:LoginDto){
     
    const user = await this.userService.findUser(dto);

    
    if (!user) {
      throw new UnauthorizedException('No user found!');}

    const passMatches = await bcrypt.compare(dto.password, user.password);

    if (!passMatches) {
      throw new UnauthorizedException('Wrong Info!');
    }

    const payload = {
      userId: user.userId,
      userRole: user.role,
    };

    return this.jwt.sign(payload);
  }

  async getUserInfo(userId:string){
    const user = await this.userService.getUserInfo(userId);

    if (!user) {
      return null;
    }

    let profile;

    if (user.role === UserRole.DONOR) {
      profile = user.donorProfile && {
        userId: user.donorProfile.userId,
        address: user.donorProfile.address,
      };
    } else if (user.role === UserRole.NGO) {
      profile = user.ngoProfile && {
        userId: user.ngoProfile.userId,
        regNo: user.ngoProfile.regNo,
        address: user.ngoProfile.address,
        verificationStatus: user.ngoProfile.verificationStatus,
      };
    } else if (user.role === UserRole.VOLUNTEER) {
      profile = user.volunteerProfile && {
        userId: user.volunteerProfile.userId,
        availability: user.volunteerProfile.availability,
        address: user.volunteerProfile.address,
      };
    }

    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile,
    };
  }
}
