import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../users/entities/user.entity.js";

@Entity("donor_profile")
export class DonorProfile{
    @PrimaryColumn('uuid')
    userId:string;

    @OneToOne(() => User, user => user.donorProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user:Relation<User>;

    @Column()
    address: string;

    @CreateDateColumn()
    createdAt:Date;
    
    @UpdateDateColumn()
    updatedAt:Date;
    
    @DeleteDateColumn()
    deletedAt:Date;
}
