import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity'; // Import enum for type-safety

export class CreateUserDto {
  @IsNotEmpty({ message: 'First name required (e.g., Kasun)' })
  @IsString()
  uFirstName: string;

  @IsNotEmpty({ message: 'Last name required (e.g., Silva)' })
  @IsString()
  uLastName: string;

  @IsNotEmpty({ message: 'Department required (e.g., Logistics)' })
  @IsString()
  department: string;

  @IsEmail({}, { message: 'Invalid email (e.g., kasun@army.lk)' })
  @IsNotEmpty()
  uEmail: string;

  @IsString()
  @MinLength(6, { message: 'Password at least 6 chars (hashed on save)' })
  password: string;

  // Role auto-set to 'officer' in service—no input for security
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // Ignored; admin-only sets
}
