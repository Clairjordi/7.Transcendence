import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from 'src/user/entities/user.entity';
import { Channel } from '../entities/channel.entity';
import { Server } from 'socket.io';
import { ChannelService } from './channel.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    private readonly channelService: ChannelService,
    private readonly userService: UserService,
  ) { }

  textWithLineBreaks(text: string){
    const regex = new RegExp(`.{1,100}`, 'g');
    return text.match(regex)?.join('\n') || '';
  }

  async create(user: User, channel: Channel, text: string, invite: string) {
    const newMessage = await this.messageRepository.create()

    const dateObj = new Date();
    const day = dateObj.getDate().toString().padStart(2, '0'); 
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString();
    const date = `${day}/${month}/${year}`;
    dateObj.setHours(dateObj.getHours() + 2);
    const hours = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   
    const dateAndHour = date + ' ' + hours;
    newMessage.createdAt = dateAndHour;
    newMessage.channel = channel;
    newMessage.user = user;
    newMessage.text = text;
    if(invite){
      newMessage.invite = invite;
      newMessage.validityLink = true;
    }
    return await this.messageRepository.save(newMessage);
  }

  async displayMessage(server: Server, channel: Channel, message: Message){
    const UserTab = await this.channelService.getChannelMembers(channel);
    let socketUserChat = [];
    for (const user of UserTab) {
      const ChannelMember = await this.userService.findByName(user.name);
      if(ChannelMember){
        socketUserChat.push(ChannelMember.socketChat);
      }
    }
    const messageToSend = ({
      id: message.id,
      name: message.user.name,
      createdAt: message.createdAt,
      text: message.text,
      invite: message.invite,
      validityLink: message.validityLink,
    });
    server.to(socketUserChat).emit('message created', messageToSend, channel.chanName);
  }
}