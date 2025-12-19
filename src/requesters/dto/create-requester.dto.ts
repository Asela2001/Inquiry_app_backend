import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsEmail,
} from 'class-validator';
import { RequesterType } from '../../entities/requester.entity';

export class CreateRequesterDto {
  @IsEnum(RequesterType)
  requesterType: RequesterType; // 'army' or 'civil'

  @IsString()
  @IsOptional()
  officerRegNo?: string; // Army only

  @IsString()
  @IsOptional()
  nic?: string; // Civil only

  @IsNotEmpty()
  @IsString()
  rFirstName: string;

  @IsNotEmpty()
  @IsString()
  rLastName: string;

  @IsEmail({}, { message: 'Valid email required' })
  @IsOptional()
  rEmail?: string;

  @IsNotEmpty({ message: 'Phone required for verification' })
  @IsString()
  phoneNo: string;

  @IsOptional()
  @IsNumber({}, { message: 'Valid rank ID' })
  rankId?: number; // FK, required for army

  @IsOptional()
  @IsNumber({}, { message: 'Valid estb ID' })
  estbId?: number; // FK, required for army
}
