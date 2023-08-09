import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import config from './config';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { MulterModule } from '@nestjs/platform-express';
import { Friends } from 'src/user/entities/friends.entity';
import { BlockerBlocked } from 'src/user/entities/blockerBlocked.entity';

@Module({
  imports: [
    MulterModule.register({}),
    PassportModule, 
    TypeOrmModule.forFeature([User, Friends, BlockerBlocked]), 
    ConfigModule.forRoot({load: [config],}),
    JwtModule.register({
      secret: '42-jwt-secret',
      signOptions: { expiresIn: '24h' },
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthController,
    AuthService,  
    {
      provide: 'CONFIGURATION',
      useValue: config,
    },
    UserService
  ],
})
export class AuthModule {}