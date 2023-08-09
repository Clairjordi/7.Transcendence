import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMatchHistoryDto } from './dto/createMatchHistory.dto';
import { MatchHistory } from './entities/matchHistory.entity';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataGame } from './entities/dataGame.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateDataGameDto } from './dto/createDataGame';
import { UserStatus } from 'src/model/interfaces';
import { UserService } from 'src/user/user.service';
import { UserGateway } from 'src/user/user.gateway';

interface BallData {
  widthBall: number,
  heightBall: number,
  xBall: number,
  yBall: number,
  xDir: number,
  yDir: number,
  speed: number,
}

interface PaddleData {
  widthPaddle: number,
  heightPaddle: number,
}

interface DataUpdateBall {
  nameRoom: string,
  xPlayerRight: number,
  yPlayerRight: number,
  xPlayerLeft: number,
  yPlayerLeft: number,
  widthCanvas: number,
  heightCanvas: number,
}

interface Score {
  scoreLeft: number,
  scoreRight: number,
}

interface DataPlayer {
  playerRight: string,
  playerLeft: string,
  playerWinner: string,
  playerLooser: string,
}

interface DataMatchMaking {
  roomName: string,
  expectedPlayer: string,
  waitingPlayer: string,
}

interface RoomData {
  ball: BallData,
  paddle: PaddleData,
  score: Score,
  namePlayer: DataPlayer,
  matchMaking: DataMatchMaking,
}

@Injectable()
export class PongService {
  private rooms: { [key: string]: Socket[] } = {};
  private roomData: { [key: string]: RoomData } = {};

  constructor(@InjectRepository(MatchHistory) private readonly matchHistoryRepo: Repository<MatchHistory>,
    @InjectRepository(DataGame) private readonly dataGameRepo: Repository<DataGame>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly userService: UserService,
    private readonly userGateway: UserGateway) { }

  async getDataGame(nameUser: string) {
    const user = await this.userRepo.findOne({
      where: { name: nameUser },
      relations: ['dataGame']
    });
    return await this.dataGameRepo.findOne({ relations: ['user'], where: { user: { id: user.id } } });
  }

  async createMatchHistory(room: string, player: string) {
    if (player === 'playerLeft') {
      const createMatchHistoryDto: CreateMatchHistoryDto = {
        playerLeftUsername: this.roomData[room].namePlayer.playerLeft,
        scorePlayerLeft: this.roomData[room].score.scoreLeft,
        scorePlayerRight: this.roomData[room].score.scoreRight,
        playerRightUsername: this.roomData[room].namePlayer.playerRight,
      }
      const [playerLeft, playerRight] = await Promise.all([
        this.userService.findByName(createMatchHistoryDto.playerLeftUsername),
        this.userService.findByName(createMatchHistoryDto.playerRightUsername)
      ]);
      if (!playerLeft || !playerRight) {
        throw new NotFoundException(`user not found`)
      }
      const create = new MatchHistory();
      create.userLeft = playerLeft;
      create.scorePlayerLeft = createMatchHistoryDto.scorePlayerLeft;
      create.scorePlayerRight = createMatchHistoryDto.scorePlayerRight;
      create.userRight = playerRight;
      await this.matchHistoryRepo.save(create);
    }
    if (player === 'playerRight') {
      const createMatchHistoryDto: CreateMatchHistoryDto = {
        playerLeftUsername: this.roomData[room].namePlayer.playerRight,
        scorePlayerLeft: this.roomData[room].score.scoreRight,
        scorePlayerRight: this.roomData[room].score.scoreLeft,
        playerRightUsername: this.roomData[room].namePlayer.playerLeft,
      }
      const [playerLeft, playerRight] = await Promise.all([
        this.userService.findByName(createMatchHistoryDto.playerLeftUsername),
        this.userService.findByName(createMatchHistoryDto.playerRightUsername)
      ]);
      if (!playerLeft || !playerRight) {
        throw new NotFoundException(`user not found`)
      }
      const create = new MatchHistory();
      create.userLeft = playerLeft;
      create.scorePlayerLeft = createMatchHistoryDto.scorePlayerLeft;
      create.scorePlayerRight = createMatchHistoryDto.scorePlayerRight;
      create.userRight = playerRight;
      await this.matchHistoryRepo.save(create);
    }
  }

  async updateDataGame(room: string, userName: string) {
    const user = await this.userRepo.findOne({
      where: { name: userName },
      relations: ['dataGame']
    });
    if (user) {
      user.status = UserStatus.Online;
      await this.userRepo.save(user);
      const dataGame = await this.dataGameRepo.findOne({ relations: ['user'], where: { user: { id: user.id } } });
      if (dataGame) {
        if (userName === this.roomData[room].namePlayer.playerWinner) {
          dataGame.win += 1;
          if (dataGame.win % 2 === 0 || dataGame.win === 1) {
            dataGame.level += 1;
          }
          if (dataGame.win === 1 && dataGame.achievementImageUrls.length === 0) {
            dataGame.achievementImageUrls.push('badge1.png');
          }
          if (dataGame.win === 3) {
            dataGame.achievementImageUrls.push('badge2.png');
          }
          if (dataGame.win === 5) {
            dataGame.achievementImageUrls.push('badge3.png');
          }
        }
        else {
          dataGame.loose += 1;
        }
        await this.dataGameRepo.save(dataGame);
      }
      else {
        let data: CreateDataGameDto;
        if (userName === this.roomData[room].namePlayer.playerWinner) {
          data = {
            win: 1,
            loose: 0,
            achievementImageUrls: ['badge1.png'],
            level: 1,
          }
        }
        else {
          data = {
            win: 0,
            loose: 1,
            achievementImageUrls: [],
            level: 0,
          }
        }
        const create = await this.dataGameRepo.create(data);
        create.user = user;
        const test = await this.dataGameRepo.save(create);
      }
    }
    this.userGateway.userModify();
  }

  async roomMatchMakingWithInvitation(client: Socket, server: Server, name: string, otherPlayer: string, status: string) {
    const roomToJoin = Object.keys(this.rooms).find(room => room === this.roomData[room].matchMaking.roomName
      && this.roomData[room].matchMaking.expectedPlayer === name && this.roomData[room].matchMaking.waitingPlayer === otherPlayer);

    if (!roomToJoin && status === 'invited') {
      client.emit('player left suddenly');
    }
    if (roomToJoin) {
      const player = this.roomData[roomToJoin].namePlayer;
      if (player.playerLeft !== name && player.playerLeft === otherPlayer) {
        this.rooms[roomToJoin].push(client);
        client.join(roomToJoin);

        player.playerRight = name;
        const userLeft = await this.userRepo.findOne({
          where: { name: player.playerLeft },
          relations: ['dataGame']
        });
        if (userLeft) {
          userLeft.status = UserStatus.InGame;
          await this.userRepo.save(userLeft);
        }
        const userRight = await this.userRepo.findOne({
          where: { name: player.playerRight },
          relations: ['dataGame']
        });
        if (userRight) {
          userRight.status = UserStatus.InGame;
          await this.userRepo.save(userRight);
        }

        client.emit('room', roomToJoin, 'playerRight');
        server.to(roomToJoin).emit('beginGame', player.playerLeft, player.playerRight);
      }
    }
    else {
      const newRoom = `room-${uuidv4()}`;
      this.rooms[newRoom] = [client];
      this.roomData[newRoom] = {
        ball: {
          widthBall: 0,
          heightBall: 0,
          xBall: 0,
          yBall: 0,
          xDir: 0,
          yDir: 0,
          speed: 0,
        },
        paddle: {
          widthPaddle: 0,
          heightPaddle: 0,
        },
        score: {
          scoreLeft: 0,
          scoreRight: 0,
        },
        namePlayer: {
          playerRight: '',
          playerLeft: '',
          playerWinner: '',
          playerLooser: '',
        },
        matchMaking: {
          roomName: '',
          expectedPlayer: '',
          waitingPlayer: '',
        },
      };
      client.join(newRoom);

      this.roomData[newRoom].namePlayer.playerLeft = name;
      this.roomData[newRoom].matchMaking.waitingPlayer = name;
      this.roomData[newRoom].matchMaking.expectedPlayer = otherPlayer;
      this.roomData[newRoom].matchMaking.roomName = newRoom;
      client.emit('room', newRoom, 'playerLeft');
    }
  }

  async joinOrCreateRoom(client: Socket, server: Server, name: string, otherPlayer: string, status: string) {
    if (otherPlayer !== 'noMatchMaking') {
      await this.roomMatchMakingWithInvitation(client, server, name, otherPlayer, status);
    }
    else {
      const roomToJoin = Object.keys(this.rooms).find(room => this.rooms[room].length === 1 && room !== this.roomData[room].matchMaking.roomName);
      if (roomToJoin) {
        const player = this.roomData[roomToJoin].namePlayer;
        if (player.playerLeft !== name) {
          this.rooms[roomToJoin].push(client);
          client.join(roomToJoin);

          player.playerRight = name;
          const userLeft = await this.userRepo.findOne({
            where: { name: player.playerLeft },
            relations: ['dataGame']
          });
          if (userLeft) {
            userLeft.status = UserStatus.InGame;
            await this.userRepo.save(userLeft);
          }
          const userRight = await this.userRepo.findOne({
            where: { name: player.playerRight },
            relations: ['dataGame']
          });
          if (userRight) {
            userRight.status = UserStatus.InGame;
            await this.userRepo.save(userRight);
          }
          client.emit('room', roomToJoin, 'playerRight');
          server.to(roomToJoin).emit('beginGame', player.playerLeft, player.playerRight);
        }
      }
      else {
        const newRoom = `room-${uuidv4()}`;
        this.rooms[newRoom] = [client];
        this.roomData[newRoom] = {
          ball: {
            widthBall: 0,
            heightBall: 0,
            xBall: 0,
            yBall: 0,
            xDir: 0,
            yDir: 0,
            speed: 0,
          },
          paddle: {
            widthPaddle: 0,
            heightPaddle: 0,
          },
          score: {
            scoreLeft: 0,
            scoreRight: 0,
          },
          namePlayer: {
            playerRight: '',
            playerLeft: '',
            playerWinner: '',
            playerLooser: '',
          },
          matchMaking: {
            roomName: '',
            expectedPlayer: '',
            waitingPlayer: '',
          },
        };
        client.join(newRoom);

        this.roomData[newRoom].namePlayer.playerLeft = name;
        client.emit('room', newRoom, 'playerLeft');
      }
    }
  }

  rightPaddleMovement(client: Socket, y: number, room: string) {
    const otherPlayer = this.rooms[room].find(player => player !== client);
    if (otherPlayer) {
      otherPlayer.emit('yPaddleRightMove', y);
    }
  }

  leftPaddleMovement(client: Socket, y: number, room: string) {
    const otherPlayer = this.rooms[room].find(player => player !== client);
    if (otherPlayer) {
      otherPlayer.emit('yPaddleLeftMove', y);
    }
  }

  handleDataPaddle(nameRoom: string, width: number, height: number) {
    this.roomData[nameRoom].paddle = {
      widthPaddle: width,
      heightPaddle: height
    }
  }

  handleDataBall(nameRoom: string, w: number, h: number, x: number, y: number) {
    let xVec: number;
    let yVec: number;

    let randomDirection = Math.floor(Math.random() * 2) + 1;
    if (randomDirection % 2) {
      xVec = 1;
    } else {
      xVec = -1;
    }
    yVec = 1;

    this.roomData[nameRoom].ball = {
      widthBall: w,
      heightBall: h,
      xBall: x,
      yBall: y,
      xDir: xVec,
      yDir: yVec,
      speed: 3,
    }
  }

  updateBall(data: DataUpdateBall, server: Server) {
    let {
      nameRoom,
      xPlayerRight,
      yPlayerRight,
      xPlayerLeft,
      yPlayerLeft,
      widthCanvas,
      heightCanvas,
    } = data

    const ball: BallData = this.roomData[nameRoom].ball;
    const score: Score = this.roomData[nameRoom].score;
    const paddle: PaddleData = this.roomData[nameRoom].paddle;

    //check top canvas bounds
    if (ball.yBall <= 10) {
      ball.yDir = 1;
    }
    //check bottom canvas bounds
    if (ball.yBall + ball.heightBall >= heightCanvas - 10) {
      ball.yDir = -1;
    }
    //check left canvas bounds
    if (ball.xBall <= 0) {
      ball.xBall = widthCanvas / 2 - ball.widthBall / 2;
      score.scoreRight += 1;
    }
    //check right canvas bounds
    if (ball.xBall + ball.widthBall >= widthCanvas) {
      ball.xBall = widthCanvas / 2 - ball.widthBall / 2;
      score.scoreLeft += 1;
    }
    //check playerLeft collision
    if (ball.xBall <= xPlayerLeft + paddle.widthPaddle) {

      if (ball.yBall >= yPlayerLeft && ball.yBall + ball.heightBall <= yPlayerLeft + paddle.heightPaddle) {
        ball.xDir = 1;
      }
    }
    //check playerRight collision
    if (ball.xBall + ball.widthBall >= xPlayerRight) {

      if (ball.yBall >= yPlayerRight && ball.yBall + ball.heightBall <= yPlayerRight + paddle.heightPaddle) {

        ball.xDir = -1;
      }
    }
    if (ball) {
      ball.xBall += ball.xDir * ball.speed;
      ball.yBall += ball.yDir * ball.speed;

      server.to(nameRoom).emit('handleUpdateBall',
        {
          x: ball.xBall, y: ball.yBall,
          scoreLeft: score.scoreLeft, scoreRight: score.scoreRight
        });
    }
  }

  whoWinorLoose(client: Socket, nameRoom: string, scoreWin: number, whichPlayer: string) {
    const score = this.roomData[nameRoom].score;
    const player = this.roomData[nameRoom].namePlayer;

    if (whichPlayer === 'playerLeft') {
      if (score.scoreLeft === scoreWin) {
        player.playerWinner = player.playerLeft;
        player.playerLooser = player.playerRight;
        client.emit('youWinOrLoose', 1);
        this.rooms[nameRoom][1].emit('youWinOrLoose', 2)
      }
      else {
        player.playerLooser = player.playerLeft;
        player.playerWinner = player.playerRight;
        client.emit('youWinOrLoose', 2);
        this.rooms[nameRoom][1].emit('youWinOrLoose', 1)
      }
    }
    else if (whichPlayer === 'playerRight') {
      if (score.scoreRight === scoreWin) {
        player.playerWinner = player.playerRight;
        player.playerLooser = player.playerLeft;
        client.emit('youWinOrLoose', 1);
        this.rooms[nameRoom][0].emit('youWinOrLoose', 2)
      }
      else {
        player.playerLooser = player.playerRight;
        player.playerWinner = player.playerLeft;
        client.emit('youWinOrLoose', 2);
        this.rooms[nameRoom][0].emit('youWinOrLoose', 1)
      }
    }
  }

  private cleanData(nameRoom: string) {
    if (this.roomData[nameRoom]) {
      const room = this.roomData[nameRoom];

      room.ball.heightBall = 0;
      room.ball.widthBall = 0;
      room.ball.xBall = 0;
      room.ball.yBall = 0;

      room.paddle.heightPaddle = 0;
      room.paddle.widthPaddle = 0;

      room.score.scoreLeft = 0;
      room.score.scoreRight = 0;

      room.namePlayer.playerRight = '';
      room.namePlayer.playerLeft = '';
    }
  }

  async leaveRoom(client: Socket) {
    const room = Object.keys(this.rooms).find(room => this.rooms[room].includes(client));
    let roomToRemove: string = null;

    if (room) {
      const index = this.rooms[room].indexOf(client);
      this.rooms[room].splice(index, 1);
      if (this.rooms[room].length === 0) {
        roomToRemove = room;
      }
      else {
        const otherClient = this.rooms[room][0];
        if (otherClient && this.roomData[room].namePlayer.playerWinner === '') {
          if (this.roomData[room].namePlayer.playerRight && this.roomData[room].namePlayer.playerLeft) {
            const userLeft = await this.userRepo.findOne({
              where: { name: this.roomData[room].namePlayer.playerLeft },
              relations: ['dataGame']
            });
            if (userLeft) {
              userLeft.status = UserStatus.Online;
              await this.userRepo.save(userLeft);
            }
            const userRight = await this.userRepo.findOne({
              where: { name: this.roomData[room].namePlayer.playerRight },
              relations: ['dataGame']
            });
            if (userRight) {
              userRight.status = UserStatus.Online;
              await this.userRepo.save(userRight);
            }
          }
          otherClient.emit('player left suddenly');

          this.userGateway.userModify();
        }
      }
    }
    if (roomToRemove) {
      this.cleanData(room);
      delete this.rooms[roomToRemove];
    }
  }
}