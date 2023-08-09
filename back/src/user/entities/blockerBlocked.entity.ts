import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("Blocker_Blocked")
export class BlockerBlocked {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.blockedByUsers)
  blocker: User;

  @ManyToOne(() => User, user => user.blockedUsers)
  blocked: User;
}
