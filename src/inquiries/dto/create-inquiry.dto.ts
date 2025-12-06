import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InquiryStatus } from '../../entities/inquiry.entity';
import { RequesterType } from '../../entities/requester.entity';

class NewRequesterDto {
  @IsEnum(RequesterType)
  requesterType: RequesterType; // 'army' or 'civil' from call

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

  @IsString()
  @IsOptional()
  rEmail?: string;

  @IsNotEmpty({ message: 'Phone required for call verification' })
  @IsString()
  phoneNo: string;

  @IsNotEmpty()
  @IsString()
  rank: string; // 'Captain' or 'N/A'

  @IsNotEmpty()
  @IsString()
  estb: string; // Unit or 'N/A'
}

export class CreateInquiryDto {
  @IsNotEmpty({ message: 'Subject required (e.g., Promotion Query)' })
  @IsString()
  subject: string;

  @IsNotEmpty({ message: 'Inquiry text required (details from call)' })
  @IsString()
  inquiryText: string;

  @IsEnum(InquiryStatus, { message: 'Status must be pending|in_progress|resolved|closed' })
  @IsOptional() // Defaults to 'pending'
  status?: InquiryStatus;

  @IsNumber({}, { message: 'Valid category ID required (e.g., 1 for Disciplinary)' })
  @IsNotEmpty()
  categoryId: number;

  // Requester details from call (create inline or use existing ID)
  @IsNumber({}, { message: 'Requester ID if existing' })
  @IsOptional()
  requesterId?: number; // Link existing; else create new below

  // Inline requester creation (for new callers)
  @IsOptional()
  @ValidateNested()
  @Type(() => NewRequesterDto)
  newRequester?: NewRequesterDto;
}