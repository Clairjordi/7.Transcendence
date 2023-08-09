import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateMatchHistoryDto {
    @IsNotEmpty()
    @IsString()
    playerLeftUsername: string;

    @IsNotEmpty()
    @IsNumber()
    scorePlayerLeft: number;

    @IsNotEmpty()
    @IsNumber()
    scorePlayerRight: number;

    @IsNotEmpty()
    @IsString()
    playerRightUsername: string;
}
