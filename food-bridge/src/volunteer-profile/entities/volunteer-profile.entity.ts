import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../users/entities/user.entity.js";

@Entity("volunteer_profile")
export class VolunteerProfile{
    @PrimaryColumn('uuid')
    userId:string;

    @OneToOne(() => User, user => user.volunteerProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user:Relation<User>;

    @Column({ type: 'enum', enum: ['AVAILABLE', 'UNAVAILABLE'], default: 'AVAILABLE' })
    availability: string;

    @Column()
    address: string;

    @CreateDateColumn()
    createdAt:Date;
    
    @UpdateDateColumn()
    updatedAt:Date;
    
    @DeleteDateColumn()
    deletedAt:Date;
}
