import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  jwt: {
    secret: 'secret-42',
  },
  typeOrmConfig: {
    type: "postgres",
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    synchronize: true,
  },
}));