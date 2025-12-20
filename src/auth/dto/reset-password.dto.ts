import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string; // Reset token from email link

  @IsString()
  @MinLength(6, { message: 'Password at least 6 chars' })
  @IsNotEmpty()
  newPassword: string;
}
