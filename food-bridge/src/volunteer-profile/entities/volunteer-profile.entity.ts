import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../users/entities/user.entity.js";
import { AvailabilityStatus } from "../../common/availability-status.enum.js";
import { VolunteerAvailability } from "./volunteer-availability.entity.js";

@Entity("volunteer_profile")
export class VolunteerProfile{
    @PrimaryColumn('uuid',{ name: 'user_id' })
    userId:string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user:User;

    @Column({ type: 'enum', enum: AvailabilityStatus, default: AvailabilityStatus.AVAILABLE })
    availability: AvailabilityStatus;

    @Column()
    address: string;

    @OneToMany(() => VolunteerAvailability, (s) => s.volunteer)
    schedule: Relation<VolunteerAvailability[]>;

    @CreateDateColumn()
    createdAt:Date;
    
    @UpdateDateColumn()
    updatedAt:Date;
    
    @DeleteDateColumn()
    deletedAt:Date;
}
