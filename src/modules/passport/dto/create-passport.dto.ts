import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePassportDto {
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsNotEmpty()
  @IsString()
  holderName: string;

  @IsNotEmpty()
  @IsString()
  holderIdNo: string;
}
