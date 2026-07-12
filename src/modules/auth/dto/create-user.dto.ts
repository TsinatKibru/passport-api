import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[@$!%*?&]/, { message: 'Password must contain at least one special character (@$!%*?&)' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsEnum(['ADMIN', 'STAFF'], { message: 'Role must be either ADMIN or STAFF' })
  @IsNotEmpty({ message: 'Role is required' })
  role: 'ADMIN' | 'STAFF';
}
