import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from 'src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friends } from './entities/friends.entity';
import { MulterModule } from '@nestjs/platform-express';
import { UserGateway } from './user.gateway';
import { BlockerBlocked } from './entities/blockerBlocked.entity';

@Module({
  imports: [MulterModule.register({}),TypeOrmModule.forFeature([User, Friends, BlockerBlocked])],
  controllers: [UserController],
  providers: [UserService, UserGateway]
})
export class UserModule { }