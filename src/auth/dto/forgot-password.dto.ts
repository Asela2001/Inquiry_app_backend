import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Valid email required' })
  @IsNotEmpty()
  uEmail: string;
}
