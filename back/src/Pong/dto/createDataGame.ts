import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateDataGameDto {
    @IsNotEmpty()
    @IsNumber()
    win: number;

    @IsNotEmpty()
    @IsNumber()
    loose: number;

    @IsArray()
    @IsString({each: true})
    achievementImageUrls: string[];

    @IsNotEmpty()
    @IsNumber()
    level: number;
}