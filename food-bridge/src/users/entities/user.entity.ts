import { Column, CreateDateColumn, DeleteDateColumn, Entity, UpdateDateColumn } from "typeorm";
import { PrimaryGeneratedColumn } from "typeorm/browser";
import { UserRole } from "../../common/user-role.enum.js";

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

    @Column({name:'is_active',type:'boolean', default:false})
    isActive:boolean;

    @CreateDateColumn()
    createdAt:Date;

    @UpdateDateColumn()
    updatedAt:Date;

    @DeleteDateColumn()
    deletedAt:Date;
}
