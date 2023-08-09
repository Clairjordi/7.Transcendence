import { SubscribeMessage, WebSocketGateway, WebSocketServer, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessageService } from './service/message.service';
import { ChannelService } from './service/channel.service';
import { UserService } from 'src/user/user.service';
import { UserChannelService } from './service/userChannel.service';
import { ChannelStatus } from '../model/interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Message } from './entities/message.entity';
import * as bcrypt from 'bcrypt'
import { Channel } from './entities/channel.entity';

interface DataOtherUser {
  name: string;
  status: string;
  avatar: string;
  role: 'owner' | 'admin' | 'user' | 'directMessage';
}

@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: ['http://localhost:3000']
  }
})

export class ChatGateway {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(Channel) private channelRepository: Repository<Channel>,
    private messageService: MessageService,
    private channelService: ChannelService,
    private userService: UserService,
    private userChannelService: UserChannelService,
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const nameUser = client.handshake.query.nameUser;
    if(nameUser === undefined){
    console.log(`Connected Chat : ${client.id}`);

    }
    else{
    console.log(`Connected Chat name  : ${nameUser} + id : ${client.id}`);

    if (typeof nameUser === 'string') {
      const user = await this.userService.findByName(nameUser);
      user.socketChat = client.id;
      const test = await this.userRepository.save(user);
    }
  }
  }

  async handleDisconnect(client: Socket) {
    const user = await this.userService.findBySocket(client.id);
    if(user){
      console.log(`Disconnected Chat name: ${user.name}  + id : ${client.id} `);
      user.socketChat = null;
      const test = await this.userRepository.save(user);

    }
    else {
      console.log(`Disconnected Chat id : ${client.id} `);
    }
  }

  ////////////////////////////
  //        CREATE          //
  ////////////////////////////

  @SubscribeMessage('createMessage')
  async createMessage(@MessageBody() data: { userName: string, chanName: string, text: string }) {
    const user = await this.userService.findByName(data.userName);
    if (!user)
      return "User not found";
    const channel = await this.channelService.findByName(data.chanName);
    if (!channel)
      return "Channel not found";
    const userChannel = await this.userChannelService.getUserChannel(user, channel);
    if (userChannel.mute === true) {
      return ("you are mute for now");
    }

    if (userChannel.ban === true)
      return ("you are ban for now");
    const text = this.messageService.textWithLineBreaks(data.text);
    const invite = null;
    const message = await this.messageService.create(user, channel, text, invite);
    await this.messageService.displayMessage(this.server, channel, message);

  }

  @SubscribeMessage('createDMMessage')
  async createDMMessage(@MessageBody() data: { userName1: string, userName2: string, text: string, invite: string }) {

    const user1 = await this.userService.findByName(data.userName1);
    const user2 = await this.userService.findByName(data.userName2);
    const channel = await this.channelService.findDirectMessageChannel(user1, user2);
    const text = this.messageService.textWithLineBreaks(data.text);
    const message = await this.messageService.create(user1, channel, text, data.invite);
    await this.messageService.displayMessage(this.server, channel, message);
  }

  @SubscribeMessage('createChannel')
  async createChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { userName: string, channelTitle: string, password: string, typeChannel: ChannelStatus, }) {
    const user = await this.userService.findByName(data.userName);
    const newChannel = await this.channelService.createChannel(data.channelTitle, data.typeChannel, data.password);
    if (!newChannel) {
      client.emit('channelCreated', newChannel, 'Channel name already exists');
    }
    else {
      const newUserChannel = await this.userChannelService.createUserChannel(user, newChannel, 'owner');
      if (newChannel && newUserChannel) {
        client.emit('channelCreated', newChannel, 'Channel created');
        this.server.emit('channelListRealTime');
      }
    }
  }

  @SubscribeMessage('createDMChannel')
  async createDMChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { userName1: string, userName2: string, }) {
    const user1 = await this.userService.findByName(data.userName1);
    const user2 = await this.userService.findByName(data.userName2);

    if (await this.channelService.isDMExist(user1, user2)) {
      client.emit('DMChannel created', "DM already exists");
      return;
    }

    const newChannel = await this.channelService.createDMChannel(data.userName1, data.userName2);
    await this.userChannelService.createUserChannel(user1, newChannel, 'directMessage');
    await this.userChannelService.createUserChannel(user2, newChannel, 'directMessage');
    client.emit('DMChannel created', "DM has been created correctly");
  }

  ////////////////////////////
  //        OTHERS          //
  ////////////////////////////

  @SubscribeMessage('joinChannel')
  async joinChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { userName: string, chanName: string }) {
    const user = await this.userService.findByName(data.userName);
    const channel = await this.channelService.findByName(data.chanName);
    const channelUsers = channel.userChannel.map((userChannel) => userChannel.user);
    if (channelUsers.some(channelUser => channelUser.id === user.id)) {
      return "User already in the channel";
    }
    await this.userChannelService.createUserChannel(user, channel, 'user');

    let socketUserChat = [];
    for (const user of channelUsers) {
      const ChannelMember = await this.userService.findByName(user.name);
      if (ChannelMember && ChannelMember.name !== data.userName) {
        socketUserChat.push(ChannelMember.socketChat);
      }
    }
    const text = `${data.userName} arrives on the channel : ${data.chanName}`;
    await this.createMessage({ userName: data.userName, chanName: data.chanName, text })

    this.server.to(socketUserChat).emit('refreshListMembers', data.chanName)
  }

  @SubscribeMessage('modifyValidityLink')
  async modifyValidityLinkOnMessage(@ConnectedSocket() client: Socket, @MessageBody() message: Message) {
    message.validityLink = false;
    const messageModified = await this.messageRepository.save(message);
    if (messageModified) {
      client.emit('validityLinkModified', false);
    }
  }

  @SubscribeMessage('passwordValidation')
  async passwordValidation(@ConnectedSocket() client: Socket, @MessageBody() data: { channelName: string, password: string }) {
    const { channelName, password } = data;
    const channel = await this.channelService.findByName(channelName);
    bcrypt.compare(password, channel.password, (err, isMatch) => {
      if (err) {
        console.log(err);
      }
      else if (isMatch) {
        client.emit('statusPasswordValidation', 'validated');
      }
      else {
        client.emit('statusPasswordValidation', 'Wrong Password, try again');
      }
    })
  }

  //modify DM channel name when a user change his name
  @SubscribeMessage('modifyChannelDM')
  async modifyChannelDM(@ConnectedSocket() client: Socket, @MessageBody() data: { newName: string, oldName: string, chanData: Channel }) {
    const { newName, oldName, chanData } = data;
    let nameChannelToget: Channel;
    const user = await this.userService.findByName(newName);

    const directMessagesWithOldName = await this.userChannelService.getChannelsByIdUser(user);
    const containsOnlyUndefined = directMessagesWithOldName.every((item) => item === undefined);
    if (!containsOnlyUndefined) {
      for (const channel of directMessagesWithOldName) {

        if (chanData !== undefined && channel.chanName === chanData.chanName) {
          const newNameChannel = channel.chanName.replace(oldName, newName);
          channel.chanName = newNameChannel;
          await this.channelRepository.save(channel);
          nameChannelToget = channel;
        }
        else {
          const newNameChannel = channel.chanName.replace(oldName, newName);
          channel.chanName = newNameChannel;
          await this.channelRepository.save(channel);
        }
      }
    }
    if (nameChannelToget) {
      client.emit('modificateNameChannelDM', nameChannelToget);
    }
    else {
      client.emit('modificateNameChannelDM', null);
    }
  }

  //RealTime message by a user blocked
  @SubscribeMessage('messageBlocked')
  async messageBlocked(@ConnectedSocket() client: Socket, @MessageBody() data: { nameUser: string, messageName: string }) {
    const user = await this.userService.findByName(data.nameUser);
    const listBlockedUser = await this.userService.getBlockedUserNames(user);
    if (listBlockedUser.includes(data.messageName)) {
      client.emit('statusMessageBlocked', true);
    }
    else {
      client.emit('statusMessageBlocked', false);
    }
  }

////////////////////////////
//        GET INFO        //
////////////////////////////

//give users blocked of a channel
@SubscribeMessage('getUsersBlocked')
async getUsersBlocked(@ConnectedSocket() client: Socket, @MessageBody() data : { nameUser: string, chanName: string } ){
  const { nameUser, chanName } = data;
  const userCurrent: User = await this.userService.findByName(nameUser);
  const channel: Channel = await this.channelService.findByName(chanName);
  const member: string[] = channel.userChannel
  .map(userChannel => userChannel.user)
  .filter(user => user.id !== userCurrent.id)
  .map(user => user.name);

  const listAllBlockedUser: string[] = await this.userService.getBlockedUserNames(userCurrent);

  const listUserBlockedChan: string[] =  member.filter(name => listAllBlockedUser.includes(name));
  client.emit('listUsersBlocked', listUserBlockedChan);
}

//give channel information only if you're not part of it - use for join a channel
@SubscribeMessage('getChannelData')
async getChannelData(@ConnectedSocket() client: Socket, @MessageBody() data: { nameUser: string, chanName: string }) {
  const { nameUser, chanName } = data;
  const user = await this.userService.findByName(nameUser);
  const channel = await this.channelService.findByName(chanName);
  const userChannel = await this.userChannelService.getUserChannel(user, channel);
  if (userChannel) {
    client.emit('channelData', channel, 'you part of it');
  }
  else {
    client.emit('channelData', channel, 'ok for join');
  }
}

@SubscribeMessage('getNameDMChannel')
async getNameDMChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { nameUser: string, user2: string }) {
  const user1 = await this.userService.findByName(data.nameUser);
  const user2 = await this.userService.findByName(data.user2);
  const chan = await this.channelService.findDirectMessageChannel(user1, user2);
  if (chan) {
    client.emit('nameDMChannel', chan.chanName);
  }
}

@SubscribeMessage('getCommonUsersDirectMessage')
async getCommonUsersDirectMessage(@ConnectedSocket() client: Socket, @MessageBody() userName: string) {
  const user: User = await this.userService.findByName(userName);
  const users: User[] = await this.channelService.getCommonUsersDirectMessage(user);

  const usersWithAvatarBase64 = users.map((userMap) => ({
    ...userMap,
    avatar: this.userService.getAvatarBase64(userMap), // Assuming 'avatar' is the path to the avatar image
  }));
  client.emit('getCommonUsersDirectMessage', usersWithAvatarBase64);
}

// Give all channels of a user
@SubscribeMessage('getUserChannels')
async getUserChannels(@ConnectedSocket() client: Socket, @MessageBody() userName: string) {
  const user = await this.userService.findByName(userName);
  const channels = await this.channelService.getUserChannels(userName);

  const channelsNotBan = await this.userChannelService.getChannelsNotBan(user, channels);
  const channelNames = channelsNotBan
    .filter((chan) => chan.chanName !== null && chan.status !== 'directMessages')
    .map(chan => chan);
  client.emit("getUserChannels", channelNames);
}

//Give all users of a channel
@SubscribeMessage('getChannelMembers')
async getChannelMembers(@ConnectedSocket() client: Socket, @MessageBody() chanName: string) {
  const user = await this.userService.findBySocket(client.id);
  const channel = await this.channelService.findByName(chanName);
  if (!user || !channel){
    return ;
  }
  const userChannel = await this.userChannelService.getUserChannel(user, channel);
  if (!userChannel){
    return ;
  }
  const members: DataOtherUser[] = [];
  if (userChannel.ban === false) {
    const allMembers = await this.channelService.getChannelMembers(channel);
    for (const member of allMembers) {
      const userChan = await this.userChannelService.getUserChannel(member, channel);
      if (userChan.ban === false) {
        const role = userChan.role === 'owner' ? 'owner' : userChan.role === 'user' ? 'user' : 'admin';
        const newMember: DataOtherUser = {
          name: member.name,
          status: member.status,
          avatar: this.userService.getAvatarBase64(member),
          role: role,
        };
        members.push(newMember);
      }
    }
  }
  client.emit('listChannelMembers', members);
}

//Give user of a DM
@SubscribeMessage('getChannelMembersDM')
async getChannelMembersDM(@ConnectedSocket() client: Socket, @MessageBody() chanName: string) {
  const userCurrent = await this.userService.findBySocket(client.id);
  const channel = await this.channelService.findByName(chanName);
  const member: DataOtherUser[] = channel.userChannel
    .map(userChannel => userChannel.user)
    .filter(user => user.id !== userCurrent.id)
    .map(member => ({
      name: member.name,
      status: member.status,
      avatar: this.userService.getAvatarBase64(member),
      role: 'directMessage',
    }));
  client.emit("getChannelMembersDM", member);
}

//Give all Messages of a channel
@SubscribeMessage('getChannelMessages')
async getChannelMessages(@ConnectedSocket() client: Socket, @MessageBody() data: { userName: string, chanName: string }) {
  const user = await this.userService.findByName(data.userName);
  const channel = await this.channelService.findByName(data.chanName);
  const userChannel = await this.userChannelService.getUserChannel(user, channel);
  let messages = []
  const listBlockedUser = await this.userService.getBlockedUserNames(user);
  if (userChannel.ban === false) {
    messages = await this.channelService.getChannelMessagesByName(data.chanName);
    for (const msg of messages) {
      if (listBlockedUser.includes(msg.name)) {
        msg.text = "content of this msg is blocked"
      }
    }
  }
  client.emit("getChannelMessages", messages);
  if (userChannel.mute === true) {
    client.emit('userMuteStatusUpdated', true, channel.chanName);
  }
}

//Give all Channels except private message
@SubscribeMessage('getAllChannelNamesExceptDM')
async getAllChannelNamesExceptDM(client: Socket) {
  const channelNames = await this.channelService.getAllChannelNamesExceptDM();
  client.emit('getAllChannelNamesExceptDM', channelNames);
}

//Give all Messages of a DM channel
@SubscribeMessage('getDMChannelMessages')
async getDMChannelMessages(@ConnectedSocket() client: Socket, @MessageBody() data: { userName1: string, userName2: string }) {
  const user1 = await this.userService.findByName(data.userName1);
  const user2 = await this.userService.findByName(data.userName2);
  const messages = await this.channelService.getDMChannelMessages(user1, user2);
  const listBlockedUser = await this.userService.getBlockedUserNames(user1);
  for (const msg of messages) {
    if (listBlockedUser.includes(msg.name)) {
      msg.text = "content of this msg is blocked"
    }
  }
  client.emit('getDMChannelMessages', messages);
}

@SubscribeMessage('getDataInvitPrivateChannel')
async getUserStatusInChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { memberName: string, channelName: string }) {
  const { memberName, channelName } = data;

  try {
    const user = await this.userService.findByName(memberName);
    const channel = await this.channelService.findByName(channelName);
    if (!user) {
      throw new Error('User not found');
    }
    if (!channel) {
      throw new Error('Channel not found');
    }
    if (channel.status !== 'private') {
      throw new Error('This channel is not private');
    }

    const userChannel = await this.userChannelService.getUserChannel(user, channel);
    if (!userChannel) {
      throw new Error('User is not a member of the channel');
    }
    if (!userChannel.Owner || !userChannel.admin) {
      throw new Error('You must be an owner or administrator to invite');
    }

    client.emit('dataInvitPrivateChannel', userChannel.role);
  } catch (error) {
    client.emit('dataInvitPrivateChannel', error.message);
  }
}

////////////////////////////
//         REMOVE         //
////////////////////////////

//quit the channel and remove it, if he is empty
@SubscribeMessage('quitChannel')
async quitChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { userName: string, chanName: string }) {
  const user = await this.userService.findByName(data.userName);
  const channel = await this.channelService.findByName(data.chanName);
  const members = await this.channelService.getChannelMembers(channel);
  let message: string;
  if (members.length > 1) {
    const userChannel = await this.userChannelService.getUserChannel(user, channel);

    let socketUserChat = [];
    for (const user of members) {
      const ChannelMember = await this.userService.findByName(user.name);
      if (ChannelMember && ChannelMember.name !== data.userName) {
        socketUserChat.push(ChannelMember.socketChat);
      }
    }
    const text = `${data.userName} quit the channel : ${data.chanName}`;
    await this.createMessage({ userName: data.userName, chanName: data.chanName, text })
    message = '';
    await this.userChannelService.removeUserChannel(userChannel);
    this.server.to(socketUserChat).emit('channelLeft', channel.chanName, message, 'update');
    message = "you quit the channel " + channel.chanName;
    client.emit('channelLeft', channel.chanName, message, 'quit');
  }
  else {
    await this.channelService.removeChannel(channel);
    message = "the channel " + channel.chanName + " has been removed";
    client.emit('channelLeft', channel.chanName, message, 'quit');
    this.server.emit('channelListRealTime');
  }
}

@SubscribeMessage('quitDMChannel')
async quitDMChannel(@MessageBody() data: { userName1: string, userName2: string }) {
  const user1 = await this.userService.findByName(data.userName1);
  const user2 = await this.userService.findByName(data.userName2);
  const channel = await this.channelService.findDirectMessageChannel(user1, user2);
  await this.channelService.removeChannel(channel);
  const tabSocketChat = [user1.socketChat, user2.socketChat]
  this.server.to(tabSocketChat).emit('quitDMChannel', channel.chanName);
}

////////////////////////////
//         ADMIN          //
////////////////////////////

@SubscribeMessage('muteChannel')
async muteUserChannelTemporarily(@ConnectedSocket() client: Socket, @MessageBody() data: { adminName: string, userName: string, chanName: string, durationSeconds: number }) {
  const admin = await this.userService.findByName(data.adminName);
  const channel = await this.channelService.findByName(data.chanName);
  const adminUserChannel = await this.userChannelService.getUserChannel(admin, channel);
  if (adminUserChannel.admin === false) {
    return "you need to be an admin in order to mute someone";
  }
  const user = await this.userService.findByName(data.userName);
  const userChannel = await this.userChannelService.getUserChannel(user, channel);
  if (userChannel.Owner === true) {
    return "you can't mute the owner of this channel";
  }
  const invite = null;
  const message = await this.messageService.create(admin, channel, `${user.name} has been mute by me during ${data.durationSeconds} seconds`, invite);
  await this.userChannelService.muteUserChannelTemporarily(this.server, user.socketChat, userChannel, data.durationSeconds, channel.chanName);

  //RealTime
  await this.messageService.displayMessage(this.server, channel, message);
  try {
    if (user && user.socketChat) {
      this.server.to(user.socketChat).emit('userMuteStatusUpdated', true, channel.chanName);
    }
  } catch (error) {
    console.error(`Error while emitting mute status to user ${data.userName}:`, error.message);
  }
}

@SubscribeMessage('banChannel')
async banUserChannelTemporarily(@ConnectedSocket() client: Socket, @MessageBody() data: { adminName: string, userName: string, chanName: string, durationSeconds: number }) {
  const admin = await this.userService.findByName(data.adminName);
  const channel = await this.channelService.findByName(data.chanName);
  const adminUserChannel = await this.userChannelService.getUserChannel(admin, channel);
  if (adminUserChannel.admin === false) {
    return "you need to be an admin in order to ban someone"
  }
  const user = await this.userService.findByName(data.userName);
  const userChannel = await this.userChannelService.getUserChannel(user, channel);
  if (userChannel.Owner === true) {
    return "you can't ban the owner of this channel"
  }
  const invite = null;
  const message = await this.messageService.create(admin, channel, `${user.name} has been ban by me during ${data.durationSeconds} seconds`, invite);
  await this.userChannelService.banUserChannelTemporarily(userChannel, data.durationSeconds);

  //RealTime
  await this.messageService.displayMessage(this.server, channel, message);
  this.server.to(user.socketChat).emit('userBan', channel.chanName, `You have been banned from the ${channel.chanName} channel by  by ${data.adminName}`);
}

@SubscribeMessage('kickChannel')
async kickChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { adminName: string, userName: string, chanName: string }) {
  const admin = await this.userService.findByName(data.adminName);
  const channel = await this.channelService.findByName(data.chanName);
  const adminUserChannel = await this.userChannelService.getUserChannel(admin, channel);
  if (adminUserChannel.admin === false) {
    return "you need to be Administarator for kick someone"
  }
  const user = await this.userService.findByName(data.userName);
  const userUserChannel = await this.userChannelService.getUserChannel(user, channel);
  if (userUserChannel.Owner === true) {
    return "you can't kick the owner of this channel"
  }
  const invite = null;
  const message = await this.messageService.create(admin, channel, `${user.name} has been kicked by me`, invite);
  await this.userChannelService.removeUserChannel(userUserChannel);

  //RealTime
  await this.messageService.displayMessage(this.server, channel, message);
  const members = await this.channelService.getChannelMembers(channel);
  let socketUserChat = [];
  for (const user of members) {
    const ChannelMember = await this.userService.findByName(user.name);
    if (ChannelMember) {
      socketUserChat.push(ChannelMember.socketChat);
    }
  }
  this.server.to(socketUserChat).emit('userKick', channel.chanName, data.userName, `You have been kicked out of the ${channel.chanName} by ${data.adminName}`);
}


@SubscribeMessage('setAdminChannel')
async setAdminChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { userName: string, chanName: string }) {
  const admin = await this.userService.findBySocket(client.id);
  const channel = await this.channelService.findByName(data.chanName);
  const adminUserChannel = await this.userChannelService.getUserChannel(admin, channel);
  if (adminUserChannel.admin === false) {
    return "you need to be an admin in order to set someone"
  }
  const user = await this.userService.findByName(data.userName);
  const userChannel = await this.userChannelService.getUserChannel(user, channel);
  if (userChannel.Owner === true) {
    return "Owner is already an admin of this channel"
  }
  const invite = null;
  const message = await this.messageService.create(admin, channel, `${user.name} has been promoted admin by me `, invite);
  await this.userChannelService.setAdminChannel(userChannel);

  //RealTime
  await this.messageService.displayMessage(this.server, channel, message);
  const members = await this.channelService.getChannelMembers(channel);
  let socketUserChat = [];
  for (const user of members) {
    const ChannelMember = await this.userService.findByName(user.name);
    if (ChannelMember) {
      socketUserChat.push(ChannelMember.socketChat);
    }
  }
  this.server.to(socketUserChat).emit('refreshListMembers', channel.chanName);
}

@SubscribeMessage('blockUser')
async blockUser(@ConnectedSocket() client: Socket, @MessageBody() userName: string) {
  const blocker = await this.userService.findBySocket(client.id);
  const blocked = await this.userService.findByName(userName);
  const blockerBlocked = await this.userService.findBlockerBlocked(blocker, blocked);
  if (!blockerBlocked) {
    await this.userService.createBlockerBlocked(blocker, blocked);
    client.emit('userBlocked', userName, true);
    this.server.to(blocked.socketChat).emit('popUpBlocked', true, blocker.name)
  }
  else {
    await this.userService.removeBlockerBlocked(blockerBlocked);
    client.emit('userBlocked', userName, false);
    this.server.to(blocked.socketChat).emit('popUpBlocked', false, blocker.name)
  }
}


////////////////////////////
//         Owner          //
////////////////////////////

@SubscribeMessage('setPassword')
async setPassword(@ConnectedSocket() client: Socket, @MessageBody() data: {chanName: string, password: string}) {
  const user = await this.userService.findBySocket(client.id);
  const channel = await this.channelService.findByName(data.chanName);
  const userChannel = await this.userChannelService.getUserChannel(user, channel);
  if (userChannel.Owner === false){
    return "You need to be a Owner for remove the channel password";
  }
  channel.status = ChannelStatus.Protected;
  channel.password = await bcrypt.hash(data.password, 10);
  return await this.channelRepository.save(channel);
}

@SubscribeMessage('setPublic')
async setPublic(@ConnectedSocket() client: Socket, @MessageBody() chanName: string) {
  const user = await this.userService.findBySocket(client.id);
  const channel = await this.channelService.findByName(chanName);
  const userChannel = await this.userChannelService.getUserChannel(user, channel);
  if (userChannel.Owner === false){
    return "You need to be a Owner for set the channel password";
  }
  channel.status = ChannelStatus.Public;
  channel.password = null;
  return await this.channelRepository.save(channel);
}

}
