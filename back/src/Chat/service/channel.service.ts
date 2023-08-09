import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Channel } from '../entities/channel.entity';
import { UserChannel } from '../entities/userChannel.entity';
import { ChannelStatus } from '../../model/interfaces';
import { UserService } from 'src/user/user.service';
import { UserChannelService } from './userChannel.service';

@Injectable()
export class ChannelService {

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Channel) private channelRepository: Repository<Channel>,
    @InjectRepository(UserChannel) private userChannelRepository: Repository<UserChannel>,
    private readonly userService: UserService,
    private readonly userChannelService: UserChannelService,

  ) {}

  async findByName(chanName: string): Promise<Channel> {
    return await this.channelRepository.findOne({
      where: { chanName: chanName },
      relations: ['userChannel', 'userChannel.user']
    });
  }

  async createChannel(chanName: string, status: ChannelStatus, password: string): Promise<Channel> {
    const channelExists = await this.channelRepository.createQueryBuilder('channel')
    .where('channel.chanName = :chanName', { chanName: chanName })
    .andWhere('channel.status != :status', { status: ChannelStatus.DirectMessages })
    .leftJoinAndSelect('channel.userChannel', 'userChannel')
    .leftJoinAndSelect('userChannel.user', 'user')
    .getOne();
    if(channelExists){      
      return null;
    }
    const newChannel = await this.channelRepository.create();
    newChannel.chanName = chanName;
    newChannel.status = status;
    if (status === ChannelStatus.Protected) {
      newChannel.password = password;
    }
    return await this.channelRepository.save(newChannel);
  }

  async createDMChannel(user1 : string, user2: string) {
    const newChannel = await this.channelRepository.create();
    newChannel.status = ChannelStatus.DirectMessages;
    newChannel.chanName = user1 + '_' + user2;
    const DMChannelCreate = await this.channelRepository.save(newChannel);
    return DMChannelCreate;
  }

  async removeChannel(channel: Channel){
    const result = this.channelRepository.remove(channel);
    return result;
  }

  async getUserChannels(userName: string) {
    const user = await this.userRepository.findOne({
      where: { name: userName },
      relations: ['userChannel', 'userChannel.channel']
    });
    const channels = user.userChannel.map(userChannel => userChannel.channel);
    return channels;
  }

  async getChannelMembers(channel: Channel) {
    const members = channel.userChannel.map(userChannel => userChannel.user);    
    return members;
  }

  async getChannelMessagesByName(chanName: string) {
    const channel = await this.channelRepository.findOne({
      where: { chanName: chanName },
      relations: ['messages', 'messages.user']
    });
    const messages = channel.messages.map(message => ({
      id: message.id,
      name: message.user.name,
      createdAt: message.createdAt,
      text: message.text,
      invite: message.invite,
      validityLink: message.validityLink,
    }));
    return messages;
  }

  async getChannelMessagesById(id: number) {
    const channel = await this.channelRepository.findOne({
      where: { id: id },
      relations: ['messages', 'messages.user']
    });
    const messages = channel.messages.map(message => ({
      id: message.id,
      name: message.user.name,
      createdAt: message.createdAt,
      text: message.text,
      invite: message.invite,
      validityLink: message.validityLink,
    }));
    return messages;
  }

  async getCommonUsersDirectMessage(user: User): Promise<User[]> {
    const directMessageChannels = await this.channelRepository.find({
      where: { status: ChannelStatus.DirectMessages },
      relations: ['userChannel', 'userChannel.user'],
    });

    const commonUsers: User[] = [];
    for (const channel of directMessageChannels) {
      const channelUserIds = channel.userChannel.map((userChannel) => userChannel.user.id);
      if (channelUserIds.includes(user.id)) {
        for (const userChannel of channel.userChannel) {
          if (userChannel.user.id !== user.id) {
            commonUsers.push(userChannel.user);
          }
        }
      }
    }
    return commonUsers;
  }

  async getAllChannelNamesExceptDM() {
    const channels = await this.channelRepository.find({
      where: { status: Not(ChannelStatus.DirectMessages) },
    });
    const channelNames = channels.map((channel) => channel.chanName);
    return channelNames;
  }

  async isDMExist(user1: User, user2: User) {
    const users = await this.getCommonUsersDirectMessage(user1);
    const userIds = users.map((user) => user.id);
    if (userIds.includes(user2.id)) {
      return true;
    }
    return false;
  }

	async findDirectMessageChannel(user1: User, user2: User) {
		const directMessageChannels = await this.channelRepository.find({
			where: { status: ChannelStatus.DirectMessages },
			relations: ['userChannel', 'userChannel.user'],
		});

		for (const channel of directMessageChannels) {
			const userChannels = channel.userChannel;
			const userChannel1 = userChannels.find((userChannel) => userChannel.user.id === user1.id);
			const userChannel2 = userChannels.find((userChannel) => userChannel.user.id === user2.id);
	
			if (userChannel1 && userChannel2) {
				return channel;
			}
		}
		return undefined;
	}

  async getDMChannelMessages(user1: User, user2: User) {
		const channel = await this.findDirectMessageChannel(user1, user2)
		const messages = await this.getChannelMessagesById(channel.id);
		return messages;
  }
}
