import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password required' })
  currentPassword: string; // Verify against hashed

  @IsString()
  @MinLength(8, { message: 'New password at least 8 characters' })
  @IsNotEmpty({ message: 'New password required' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm new password required' })
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
  //   message: 'Passwords must match',
  // }) // Match newPassword (custom validator if needed)
  confirmNewPassword: string;
}
// function createValidator(arg0: (value: any, args: any) => { matchNewPassword: boolean; } | null) {
//     throw new Error('Function not implemented.');
// }

