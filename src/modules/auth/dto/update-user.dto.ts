import { IsEmail, IsString, IsBoolean, IsEnum, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @IsOptional()
  name?: string;

  @IsEnum(['ADMIN', 'STAFF'], { message: 'Role must be either ADMIN or STAFF' })
  @IsOptional()
  role?: 'ADMIN' | 'STAFF';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
