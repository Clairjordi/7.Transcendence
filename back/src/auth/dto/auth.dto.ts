import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  login: string;
}

export class UpdateUserDto extends PartialType(RegisterUserDto){
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsBoolean()
  twoFA: boolean;
}