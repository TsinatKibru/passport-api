import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateSlotDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsNotEmpty()
  @IsString()
  rowId: string;

  @IsInt()
  @Min(1)
  position: number;
}
