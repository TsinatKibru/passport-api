import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BatchAssignPassportDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  passportIds: string[];

  @IsNotEmpty()
  @IsString()
  boxId: string;

  @IsOptional()
  @IsString()
  slotQrCode?: string;

  @IsOptional()
  @IsBoolean()
  overrideLocation?: boolean;

  @IsNotEmpty()
  @IsIn(['PASSPORT_ASSIGNED', 'PASSPORT_RETURNED'])
  action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED';
}

export class EnhancedBatchAssignPassportDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  passportIds: string[];

  @IsNotEmpty()
  @IsString()
  selectedBoxId: string;

  @IsNotEmpty()
  @IsString()
  scannedBoxQr: string;

  @IsNotEmpty()
  @IsString()
  scannedSlotQr: string;

  @IsNotEmpty()
  @IsIn(['PASSPORT_ASSIGNED', 'PASSPORT_RETURNED'])
  action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED';
}
