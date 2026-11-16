import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../users/entities/user.entity.js";

@Entity("volunteer_profile")
export class VolunteerProfile{
    @PrimaryColumn('uuid',{ name: 'user_id' })
    userId:string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user:User;

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
