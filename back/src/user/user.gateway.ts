import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { UserService } from './user.service';
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    namespace:"/user",
    cors: {
      origin: ['http://localhost:3000']
    }
  })
  export class UserGateway {
    constructor(private readonly user: UserService){}

    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Connected userGateway : ${client.id}`);  
      }
      
      @SubscribeMessage('user modify')
      userModify(){
        this.server.emit('user modification');
      }

      @SubscribeMessage('user Name modify')
      userNameModify(@MessageBody() data :{newName:string, oldName: string}){
        const {newName, oldName} = data;
        this.server.emit('user Name modification', { newName, oldName });
      }

      @SubscribeMessage('user Avatar modify')
      userAvatarModify(@MessageBody() name: string){
        this.server.emit('user Avatar modification', name);
      }

      handleDisconnect(client: Socket) {
        console.log(`Disconnected userGateway : ${client.id}`);  
      }

  }