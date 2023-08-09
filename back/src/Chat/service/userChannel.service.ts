import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Channel } from '../entities/channel.entity';
import { UserChannel } from '../entities/userChannel.entity';
import { Server} from 'socket.io';

@Injectable()
export class UserChannelService {
  constructor(
    @InjectRepository(UserChannel) private readonly userChannelRepository: Repository<UserChannel>,
  ) { }

  async createUserChannel(user: User, channel: Channel, status: string): Promise<UserChannel> {
    const userChannel = await this.userChannelRepository.create();
    userChannel.user = user;
    userChannel.channel = channel;

    if (status === 'owner'){
      userChannel.Owner = true;
      userChannel.admin = true;
      userChannel.role = status;
    }
    else if(status === 'directMessage'){
      userChannel.role = status;
    }
    else if(status === 'user'){
      userChannel.role = status;
    }
    return await this.userChannelRepository.save(userChannel);
  }

  async removeUserChannel(userChannel: UserChannel){
    const result = this.userChannelRepository.remove(userChannel)
    return result;
  }

  async getUserChannel(user: User, channel: Channel): Promise<UserChannel | undefined> {
    const userChannel = await this.userChannelRepository
      .createQueryBuilder('userChannel')
      .where('userChannel.user = :userId', { userId: user.id })
      .andWhere('userChannel.channel = :channelId', { channelId: channel.id })
      .getOne();
    return userChannel;
  }

  async getChannelsByIdUser(user: User){
    const userChannelsDM = await this.userChannelRepository
    .createQueryBuilder('userChannel')
    .leftJoinAndSelect('userChannel.channel', 'channel')
    .where('userChannel.user = :userId', { userId: user.id })
    .andWhere('userChannel.role = :role', { role: 'directMessage' })
    .getMany();

    const channelNamesOldName = userChannelsDM.map((userChannel) => userChannel.channel);

    return channelNamesOldName;
  }

  async muteUserChannelTemporarily(server: Server, userSocketChat: string, userChannel: UserChannel, durationSeconds: number, channelName: string): Promise<number> {
    userChannel.mute = true;
    await this.userChannelRepository.save(userChannel);
  
    const remainingTime = durationSeconds * 1000;
  
    setTimeout(async () => {
      userChannel.mute = false;
      await this.userChannelRepository.save(userChannel);
      server.to(userSocketChat).emit('userMuteStatusUpdated', false, channelName);
    }, remainingTime);
  
    return remainingTime;
  } 

  async banUserChannelTemporarily(userChannel: UserChannel, durationSeconds: number) {
    userChannel.ban = true;
    await this.userChannelRepository.save(userChannel);
    
    setTimeout(async () => {
      userChannel.ban = false;
      await this.userChannelRepository.save(userChannel);
    }, durationSeconds * 1000);
  }

  async getChannelsNotBan(user: User, channels: Channel[]) {
    const channelsNotBan: Channel[] = [];
    for (const channel of channels) {
      const userChannel = await this.getUserChannel(user, channel);
      const isBanned = userChannel?.ban;
      if (isBanned === false)
        channelsNotBan.push(channel)
    }
    return channelsNotBan;
  }

  async setAdminChannel(userChannel: UserChannel) {
    userChannel.admin = true;
    userChannel.role = "admin";
    return await this.userChannelRepository.save(userChannel);
  }
}