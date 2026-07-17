import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  shelfId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;
}
