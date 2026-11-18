import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../users/entities/user.entity.js";

@Entity("ngo_profile")
export class NgoProfile{
    @PrimaryColumn('uuid')
    userId:string;

    @OneToOne(() => User, user => user.ngoProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user:Relation<User>;

    @Column({ name: 'registration_number', unique: true })
    regNo: string;

    @Column()
    address: string;

    @Column({ type: 'enum', enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' })
    verificationStatus: string;

    @CreateDateColumn()
    createdAt:Date;
    
    @UpdateDateColumn()
    updatedAt:Date;
    
    @DeleteDateColumn()
    deletedAt:Date;
}
