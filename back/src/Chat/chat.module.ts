import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Channel } from './entities/channel.entity';
import { User } from 'src/user/entities/user.entity';
import { MessageService } from './service/message.service';
import { ChannelService } from './service/channel.service';
import { UserService } from 'src/user/user.service';
import { UserChannel } from './entities/userChannel.entity';
import { UserChannelService } from './service/userChannel.service';
import { Friends } from 'src/user/entities/friends.entity';
import { BlockerBlocked } from "src/user/entities/blockerBlocked.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Message, Channel, UserChannel, User, Friends, BlockerBlocked])],
  providers: [
    ChatGateway,
    MessageService,
    ChannelService,
    UserService,
    UserChannelService],
  exports: [UserService],
})

export class ChatModule { }