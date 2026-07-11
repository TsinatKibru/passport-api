import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignPassportDto {
  @IsNotEmpty()
  @IsString()
  boxId: string;

  @IsOptional()
  @IsString()
  slotQrCode?: string;

  @IsOptional()
  @IsBoolean()
  overrideLocation?: boolean;
}
