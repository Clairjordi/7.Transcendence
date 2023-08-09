import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PongService } from './pong.service';

@WebSocketGateway({
  namespace:'/gameplay',
  cors: {
    origin: ['http://localhost:3000']
  }
})
export class PongGateway {
  constructor(private readonly pong: PongService){}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Connected pong : ${client.id}`);  
  }

  @SubscribeMessage('getDataGame')
  async getDataGame(@ConnectedSocket() client: Socket, @MessageBody() nameUser: string){
    const DataGame = await this.pong.getDataGame(nameUser);
    client.emit('resultDataGame', DataGame);
  }

  @SubscribeMessage('registeredRoom')
  async registeredRoom(@ConnectedSocket() client: Socket, @MessageBody() data : {name: string, otherPlayer: string, status: string}){
    await this.pong.joinOrCreateRoom(client, this.server, data.name, data.otherPlayer, data.status);
  }

  @SubscribeMessage('finalScore')
  createMatchHistory(@MessageBody() data: {room: string, player: string}){
    this.pong.createMatchHistory(data.room, data.player);
  }

  @SubscribeMessage('updateGame')
  async updateDataGame(@MessageBody() data: {room: string, user: string}){
    await this.pong.updateDataGame(data.room, data.user);
  }

  @SubscribeMessage('finished')
    leaveRoom(@ConnectedSocket() client: Socket) {
      this.pong.leaveRoom(client);
  }

  @SubscribeMessage('yPaddleRight')
    rightPaddleMovement(@ConnectedSocket() client: Socket, @MessageBody() data: { y: number, room: string }){
      this.pong.rightPaddleMovement(client, data.y, data.room);
  }

  @SubscribeMessage('yPaddleLeft')
  leftPaddleMovement(@ConnectedSocket() client: Socket, @MessageBody() data: { y: number, room: string }){
    this.pong.leftPaddleMovement(client, data.y, data.room);
  }
 
  @SubscribeMessage('dataBall')
  handleDataBall(@MessageBody() data: { name: string, width: number, height: number, x: number, y: number}){
    const {name, width, height, x, y} = data;
    this.pong.handleDataBall(name, width, height, x, y);
  }

  @SubscribeMessage('dataPaddle')
  handleDataPaddle(@MessageBody() data: { name: string, width: number, height: number}){
    this.pong.handleDataPaddle(data.name, data.width, data.height);
  }

  @SubscribeMessage('updateBall')
  updateBall(@MessageBody() data: {
    nameRoom: string, 
    xPlayerRight: number, 
    yPlayerRight: number,
    xPlayerLeft: number,
    yPlayerLeft: number,
    widthCanvas: number,
    heightCanvas: number,
    }){
      
    this.pong.updateBall(data, this.server);
  }

  @SubscribeMessage('whoWinorLoose')
  whoWinorLoose(@ConnectedSocket() client: Socket, @MessageBody() data: {name: string, score:number, player: string}){
    this.pong.whoWinorLoose(client, data.name, data.score, data.player);
  }

  handleDisconnect(client: Socket) {
    this.pong.leaveRoom(client);
    console.log(`Disconnected pong : ${client.id}`);  
  }
}
