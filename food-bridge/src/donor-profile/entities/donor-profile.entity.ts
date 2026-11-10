import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity.js";

@Entity("donor_profile")
export class DonorProfile{
    @PrimaryColumn('uuid',{name:'donor_id'})
    id:string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({name:'donor_id',})
    user:User;

    @Column()
    address: string;

}