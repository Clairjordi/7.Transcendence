import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import ormconfig from 'ormconfig';
import config from './auth/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './Chat/chat.module';
import { PongModule } from './Pong/pong.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
    }), TypeOrmModule.forRoot(ormconfig), UserModule, PongModule, ChatModule, AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}