import { Module } from '@nestjs/common';
import { PongService } from './pong.service';
import { PongGateway } from './pong.gateway';
import { MatchHistory } from 'src/Pong/entities/matchHistory.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { DataGame } from './entities/dataGame.entity';
import { UserService } from 'src/user/user.service';
import { Friends } from 'src/user/entities/friends.entity';
import { UserGateway } from 'src/user/user.gateway';
import { BlockerBlocked } from "src/user/entities/blockerBlocked.entity";

@Module({
  imports: [TypeOrmModule.forFeature([MatchHistory, DataGame, User, Friends, BlockerBlocked])],
  providers: [PongGateway, PongService, UserService, UserGateway]
})
export class PongModule {}
