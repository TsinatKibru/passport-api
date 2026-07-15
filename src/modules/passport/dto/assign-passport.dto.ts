import { IsNotEmpty, IsString } from 'class-validator';

export class AssignPassportDto {
  @IsNotEmpty()
  @IsString()
  boxId: string;
}
