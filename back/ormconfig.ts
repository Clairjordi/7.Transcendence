import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { ConfigModule } from '@nestjs/config';
import { User } from "src/user/entities/user.entity";
import { Message } from "src/Chat/entities/message.entity";
import { Channel } from "src/Chat/entities/channel.entity";
import { UserChannel } from "src/Chat/entities/userChannel.entity";
import { MatchHistory } from "src/Pong/entities/matchHistory.entity";
import { DataGame } from "src/Pong/entities/dataGame.entity";
import { Friends } from "src/user/entities/friends.entity";
import { BlockerBlocked } from "src/user/entities/blockerBlocked.entity";

ConfigModule.forRoot({ envFilePath: ['../.env'] })

const ormconfig: PostgresConnectionOptions = {
    type: "postgres",
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    synchronize: true, //true for development environment- false for the production environment
    entities: [User, MatchHistory, DataGame, Channel, UserChannel, Message, Friends, BlockerBlocked],
};

export default ormconfig;
