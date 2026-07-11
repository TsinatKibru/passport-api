import { IsNotEmpty, IsString } from 'class-validator';

export class MoveBoxDto {
  @IsNotEmpty()
  @IsString()
  slotId: string;
}
