import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne,} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './channel.entity';

@Entity("Message")
export class Message {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column()
  createdAt: string;

  @Column({ nullable: true })
  invite?: string;

  @Column({ default: false })
  validityLink: boolean;

  //Relation
  @ManyToOne(() => User, (user) => user.messages)
  user: User;

  @ManyToOne(() => Channel, (channel) => channel.messages,{
    onDelete: 'CASCADE',
})

  channel: Channel;
  linkValidity: boolean;
}