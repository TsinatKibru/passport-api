import { IsNotEmpty, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

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

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1' })
  @Max(100, { message: 'Capacity cannot exceed 100' })
  capacity?: number;
}
