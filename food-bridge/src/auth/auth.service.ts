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
    // Hash before opening the database transaction.
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Keep both inserts in one transaction so a failed profile insert also
    // rolls back the user insert.
    return this.dataSource.transaction(async (manager) => {
      // The registration endpoint decides the role; don't trust dto.role.
      const user = await this.userService.createUser(manager, {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: UserRole.DONOR
      });

      // The saved user now has its generated ID. Use it with the donor address.
      const profile = await this.donorProfileService.createProfile(
        manager, user.userId,
        dto.address,
      );

      // Return safe account fields only; never return the password.
      return {
        message: 'Registration successful.',
        user: {
          id: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        profile,
      };
    });
  }

  async registerNgo(dto:NgoDto){
      // Hash before opening the database transaction.
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
            profile}
        }
      )
  }

  async registerVolunteer(dto:VolunteerDto){
      // Hash before opening the database transaction.
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
            profile}
        }
      )
  }

  async login(dto:LoginDto){
    // Find the account 
    const user = await this.userService.findUser(dto);

    // no user
    if (!user) {
      throw new UnauthorizedException('Invalid email/phone or password.');}

    // Compare the submitted password with the bcrypt hash saved at registration.
    const passMatches = await bcrypt.compare(dto.password, user.password);

    if (!passMatches) {
      throw new UnauthorizedException('Invalid email/phone or password.');
    }

    const payload = {
      userID: user.userId,
      userRole: user.role,
    };

    return this.jwt.sign(payload);
    
  }
}
