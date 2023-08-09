import { IsArray, IsNumber } from 'class-validator';

export class CreateFriendsDto {
    @IsArray()
    @IsNumber({},{each: true})
    friends: number[];
}