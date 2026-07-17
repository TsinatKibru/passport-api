import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSlotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  rowId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;
}
