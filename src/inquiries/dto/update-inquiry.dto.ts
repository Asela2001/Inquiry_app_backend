import { PartialType } from '@nestjs/mapped-types';
import { CreateInquiryDto } from './create-inquiry.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateInquiryDto extends PartialType(CreateInquiryDto) {
  @IsOptional()
  @IsString()
  responseText?: string; // Add handling notes

  // For attachments, handle in separate endpoint (multer upload)
}
