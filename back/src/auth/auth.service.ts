import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { RegisterUserDto } from './dto/auth.dto';
import { UpdateUserDto } from './dto/auth.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { UserStatus } from 'src/model/interfaces';
import * as crypto from 'crypto';
import { encode as base32Encode } from 'thirty-two';
import * as qrcode from 'qrcode';
import * as sharp from 'sharp';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>
  ) { }

  async saveProfile(profile: RegisterUserDto): Promise<void> {

    const existingUser = await this.userRepository.findOne({ where: { login: profile.login } });

    if (existingUser) {
      return;
    }

    let user = new User();
    user.login = profile.login;

    await this.userRepository.save(user);
  }

  async findByLogin(login: string) {
    const user = await this.userRepository.findOne({ where: { login: login } });
    return user;
  }

  async findByName(name: string) {
    const user = await this.userRepository.findOne({ where: { name: name } });
    return user;
  }

  async generateSecretKey(): Promise<string> {
    const secretKeyBytes = crypto.randomBytes(10);
    const secretKey = base32Encode(secretKeyBytes, 'RFC4648');
    return secretKey;
  }

  async enableTwoFA(user: User, secretKey: string) {
    user.twoFA = true;
    user.secretKey = secretKey;
    return await this.userRepository.save(user);
  }

  async disableTwoFA(user: User) {
    user.twoFA = false;
    return await this.userRepository.save(user);
  }

  async generateQRCode(secretKey: string, name: string): Promise<string> {

    const qrCodeData = `otpauth://totp/transcendenceMEC:${name}?secret=${secretKey}&issuer=transcendenceMEC`;

    try {
      const qrCodeUrl = await qrcode.toDataURL(qrCodeData);
      return qrCodeUrl;
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to generate QR Code', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUserProfileNoFA(login: string, updateUserDto: UpdateUserDto, avatar: string) {
    const user = await this.findByLogin(login);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.name = updateUserDto.name;

    if (!user.avatar)
      user.avatar = avatar;

    const updatedUser = await this.userRepository.save(user);
    const token = this.generateToken(updatedUser.name);
    const decodedToken: any = jwt.verify(token, 'secret-42');
    const decodedName: string = decodedToken.name;

    return {
      user: updatedUser,
      token: token,
      decodedName: decodedName,
    };
  }

  async uploadAvatar(login: string, avatar: Express.Multer.File): Promise<string> {
    const user = await this.findByLogin(login);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatarFileName = `${Date.now()}.${avatar.originalname.split('.').pop()}`;

    const avatarDirectory = path.join(__dirname, '../../../src/avatars');
    const avatarPath = path.join(avatarDirectory, avatarFileName);

    if (!fs.existsSync(avatarDirectory)) {
      fs.mkdirSync(avatarDirectory, { recursive: true });
    }

    fs.writeFileSync(avatarPath, avatar.buffer);
    await sharp(avatar.buffer).toFile(avatarPath);

    user.avatar = avatarFileName;

    await this.userRepository.save(user);

    return avatarFileName;
  }

  generateToken(name: string): string {
    const secretKey = 'secret-42';
    const userProfile = { name: name };

    const token = jwt.sign(userProfile, secretKey);
    return token;
  }

  async updateRelog(user: User) {
    user.status = UserStatus.Online;
    return await this.userRepository.update(user.id, { status: user.status });
  }
}