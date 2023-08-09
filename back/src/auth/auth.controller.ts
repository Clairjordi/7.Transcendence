import { UploadedFile, UseInterceptors, Controller, HttpStatus, HttpException, Post, Body, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenExchangeDto } from './dto/token-exchange.dto';
import fetch from 'node-fetch';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dto/auth.dto';
import { UpdateUserDto } from './dto/auth.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as speakeasy from 'speakeasy';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private jwtService: JwtService) {}

  ///////////
  // POST //
  //////////

  @Post('token')
  async exchangeCodeForToken(@Body() tokenExchangeDto: TokenExchangeDto) {
    const { code, clientId, clientSecret, redirectUri } = tokenExchangeDto;

    const response = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange authorization code for access token');
    }
    
    const responseBody = await response.json();
    const { access_token } = responseBody;

    return { access_token };
  }

  @Post('profile')
  async saveProfile(@Body() profile: RegisterUserDto) {
    try {
      const response = await this.authService.saveProfile(profile);
      return HttpStatus.CREATED;
    } catch (error) {
      console.log(error);
      throw new HttpException('Failed to save user profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('find')
  async getByLogin(@Body() profile:RegisterUserDto) {
    return await this.authService.findByLogin(profile.login);
  }

  @Post('verify')
  async verifyTwoFA(@Body() { code }: { code: string }, @Body() { usrName }: { usrName: string }) {
    const user = await this.authService.findByName(usrName);

    if (user) {
      const secret = user.secretKey;

      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      if (verified) {
        return { message: 'La vérification du code de deux facteurs a réussi' };
      } else {
        throw new HttpException(
          'La vérification du code de deux facteurs a échoué',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Body('login') login: string, @UploadedFile() avatar: Express.Multer.File) {
    try {
      const avatarFileName = await this.authService.uploadAvatar(login, avatar);
      return { avatar: avatarFileName };
    } catch (error) {
      console.log(error);
      throw new HttpException('Failed to upload avatar', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //////////
  // PUT //
  /////////

  @Put('complete')
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Body() data: { name: string, login: string, avatar: string },
    @Body('twoFA') twoFA: boolean
  ) {
    if (!data.name) {
      return 'You must fill a nickname in order to continue.';
    }
  
    const checkuser = await this.authService.findByName(updateUserDto.name);
    if (checkuser) {
      return 'This nickname already exists. Please choose another one.';
    }
  
    const updatedUser = await this.authService.updateUserProfileNoFA(data.login, updateUserDto, data.avatar);
  
    if (twoFA) {
      const secretKey = await this.authService.generateSecretKey();
      const qrCodeUrl = await this.authService.generateQRCode(secretKey, updateUserDto.name);
  
      await this.authService.enableTwoFA(updatedUser.user, secretKey);
  
      return {
        user: updatedUser.user,
        token: updatedUser.token,
        decodedName: updatedUser.decodedName,
        qrCodeUrl: qrCodeUrl,
      };
    }
  
    return {
      user: updatedUser.user,
      token: updatedUser.token,
      decodedName: updatedUser.decodedName,
    };
  }
 
  @Put('relog')
  async updateRelog(@Body("name") name:string) {
    const user = await this.authService.findByName(name);
    return await this.authService.updateRelog(user);
  }

  @Put('qrcode')
  async DoubleAuthUpdate(@Body("name") name:string) {

    const user = await this.authService.findByName(name);
    const secretKey = await this.authService.generateSecretKey();
    const qrCodeUrl = await this.authService.generateQRCode(secretKey, name);
  
    await this.authService.enableTwoFA(user, secretKey);
  
    return { qrCodeUrl };
  }

  @Put('twoFA')
  async disabledtwoFA(@Body("name") name:string) {

    const user = await this.authService.findByName(name);
    await this.authService.disableTwoFA(user);
  }
}