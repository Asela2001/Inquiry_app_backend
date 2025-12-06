import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export enum UserRole {
  OFFICER = 'officer',
  ADMIN = 'admin',
}

export class SigninDto {
  @IsEmail()
  uEmail: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// For admin creating officers (used later in Users module)
export class CreateOfficerDto {
  @IsString()
  uFirstName: string;

  @IsString()
  uLastName: string;

  @IsString()
  department: string;

  @IsEmail()
  uEmail: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole = UserRole.OFFICER;
  // Role fixed to 'officer' in service
}
