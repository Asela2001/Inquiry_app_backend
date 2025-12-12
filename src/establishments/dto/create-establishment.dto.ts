import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum EstbType {
  MILITARY = 'military',
  CIVIL = 'civil',
}

export class CreateEstablishmentDto {
  @IsNotEmpty({
    message: 'Establishment name required (e.g., Colombo Garrison)',
  })
  @IsString()
  @MinLength(3, { message: 'Name at least 3 chars' })
  estbName: string;

  @IsEnum(EstbType)
  @IsNotEmpty({ message: 'Type required (military or civil)' })
  estbType: EstbType;
}
