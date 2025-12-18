import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from 'src/entities/attachment.entity';
import { Inquiry } from 'src/entities/inquiry.entity';
import { Response } from 'src/entities/response.entity';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    @InjectRepository(Inquiry) private inquiryRepo: Repository<Inquiry>,
    @InjectRepository(Response) private responseRepo: Repository<Response>,
  ) {}

  async uploadToInquiry(
    file: Express.Multer.File,
    inquiryId: number,
  ): Promise<Attachment> {
    const inquiry = await this.inquiryRepo.findOne({ where: { inquiryId } });
    if (!inquiry) throw new BadRequestException('Inquiry not found');

    // Save file to /uploads (rename for uniqueness)
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `uploads/${fileName}`;
    fs.writeFileSync(filePath, file.buffer); // Save from Multer memory

    const attachment = this.attachmentRepo.create({
      filePath, // Matches DB column
      inquiry, // Sets inquiry_id FK
    });
    return this.attachmentRepo.save(attachment);
  }

  async uploadToResponse(
    file: Express.Multer.File,
    responseId: number,
  ): Promise<Attachment> {
    const response = await this.responseRepo.findOne({ where: { responseId } });
    if (!response) throw new BadRequestException('Response not found');

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `uploads/${fileName}`;
    fs.writeFileSync(filePath, file.buffer);

    const attachment = this.attachmentRepo.create({
      filePath,
      response, // Sets response_id FK
    });
    return this.attachmentRepo.save(attachment);
  }

  async findByInquiry(inquiryId: number): Promise<Attachment[]> {
    return this.attachmentRepo.find({ where: { inquiry: { inquiryId } } });
  }

  async findByResponse(responseId: number): Promise<Attachment[]> {
    return this.attachmentRepo.find({ where: { response: { responseId } } });
  }

  async delete(attachmentId: number): Promise<void> {
    const attachment = await this.attachmentRepo.findOne({
      where: { attachmentId },
    });
    if (!attachment) throw new BadRequestException('Attachment not found');

    // Delete file from disk
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    await this.attachmentRepo.remove(attachment);
  }
}