import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("friends")
export class Friends {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('integer', { array: true, default: '{}' })
    friends: number[];

    @OneToOne(() => User, (user) => user.friends)
    user: User;
}