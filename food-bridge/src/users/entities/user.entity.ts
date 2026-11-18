import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

    @CreateDateColumn()
    createdAt:Date;

    @UpdateDateColumn()
    updatedAt:Date;

    @DeleteDateColumn()
    deletedAt:Date;
}
