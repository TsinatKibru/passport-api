import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateShelfDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsInt()
  @Min(1)
  position: number;
}
