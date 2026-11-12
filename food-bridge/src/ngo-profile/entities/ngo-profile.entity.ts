import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../users/entities/user.entity.js";

@Entity("ngo_profile")
export class NgoProfile{
    @PrimaryColumn('uuid',{ name: 'user_id' })
    userId:string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user:User;

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
