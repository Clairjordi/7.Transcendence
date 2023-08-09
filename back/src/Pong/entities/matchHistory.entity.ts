import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("matchHistory")
export class MatchHistory {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.matchHistory)
    userLeft: User;

    @Column({  })
    scorePlayerLeft: number;

    @Column({  })
    scorePlayerRight: number;

    @ManyToOne(() => User, (user) => user.matchHistory)
    userRight: User;
}
