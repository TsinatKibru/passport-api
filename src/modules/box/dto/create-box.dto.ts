import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoxDto {
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  slotId?: string;
}
