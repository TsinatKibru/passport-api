import { IsOptional, IsString } from 'class-validator';

export class UpdatePassportDto {
  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  holderName?: string;

  @IsOptional()
  @IsString()
  holderIdNo?: string;
}
