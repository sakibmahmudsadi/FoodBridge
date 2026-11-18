import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToOne, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { PrimaryGeneratedColumn } from "typeorm/browser";
import { UserRole } from "../../common/user-role.enum.js";
import { DonorProfile } from "../../donor-profile/entities/donor-profile.entity.js";
import { NgoProfile } from "../../ngo-profile/entities/ngo-profile.entity.js";
import { VolunteerProfile } from "../../volunteer-profile/entities/volunteer-profile.entity.js";

@Entity('users')
export class User{
    
    @PrimaryGeneratedColumn('uuid')
    userId:string;

    @Column()
    name: string;

    @Column({unique:true})
    email: string;

    @Column({unique:true})
    phone: string;

    @Column()
    password: string;

    @Column({type:"enum",enum:UserRole})
    role:UserRole;

    @CreateDateColumn()
    createdAt:Date;

    @UpdateDateColumn()
    updatedAt:Date;

    @DeleteDateColumn()
    deletedAt:Date;

    @OneToOne(() => DonorProfile, donorProfile => donorProfile.user)
    donorProfile: Relation<DonorProfile>;

    @OneToOne(() => NgoProfile, ngoProfile => ngoProfile.user)
    ngoProfile: Relation<NgoProfile>;

    @OneToOne(() => VolunteerProfile, volunteerProfile => volunteerProfile.user)
    volunteerProfile: Relation<VolunteerProfile>;
}
