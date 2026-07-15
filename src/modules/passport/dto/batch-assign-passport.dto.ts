import { IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class BatchAssignPassportDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  passportIds: string[];

  @IsNotEmpty()
  @IsString()
  boxId: string;

  @IsNotEmpty()
  @IsIn(['PASSPORT_ASSIGNED', 'PASSPORT_RETURNED'])
  action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED';
}
