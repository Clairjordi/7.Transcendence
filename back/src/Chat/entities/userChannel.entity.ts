import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn,} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './channel.entity';

@Entity("User_Channel")
export class UserChannel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  Owner: boolean;

  @Column({ default: false })
  admin: boolean;

  @Column({ default: false })
  mute: boolean;

  @Column({ default: false })
  ban: boolean;

  @Column({ default: 'user' })
  role: 'owner' | 'admin' | 'user' | 'directMessage';
  
  //Relation
  @ManyToOne(() => User, (user) => user.userChannel)
  user: User;

  @ManyToOne(() => Channel, (channel) => channel.userChannel, {
    onDelete: 'CASCADE',
  })
  channel: Channel;
}