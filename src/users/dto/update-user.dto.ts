import { Exclude } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { PartialType } from '@nestjs/mapped-types';

// @Exclude()
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  password?: never; // Block—use separate reset endpoint

  @IsOptional()
  role?: never; // Block—admin sets on create only
}
