import { Entity, Column, PrimaryGeneratedColumn, OneToMany, BeforeInsert } from 'typeorm';
import { Message } from './message.entity';
import { UserChannel } from './userChannel.entity';
import { ChannelStatus } from '../../model/interfaces';
import * as bcrypt from 'bcrypt'

@Entity("Channel")
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ })
  chanName: string;

  @Column({ default: ChannelStatus.Public })
  status: ChannelStatus;

  @Column({ nullable: true })
  password: string;

  @BeforeInsert()
  async hashPasword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  //Relation
  @OneToMany(() => Message, (message) => message.channel, { cascade: true })
  messages: Message[];

  @OneToMany(() => UserChannel, (userChannel) => userChannel.channel, { cascade: true })
  userChannel: UserChannel[];
}