import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdateBoxDto {
  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1' })
  @Max(100, { message: 'Capacity cannot exceed 100' })
  capacity?: number;
}
