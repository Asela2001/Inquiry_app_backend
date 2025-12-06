import {
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { UserRole } from 'src/entities/user.entity';

export class SignupDto {
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  uFirstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  uLastName: string;

  @IsNotEmpty({ message: 'Department is required' })
  @IsString({ message: 'Department must be a string' })
  department: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  uEmail: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsEnum(UserRole, { message: 'Invalid role: must be admin or officer' })
  role: UserRole;
}
