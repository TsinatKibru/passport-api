import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateRowDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsNotEmpty()
  @IsString()
  shelfId: string;

  @IsInt()
  @Min(1)
  position: number;
}
