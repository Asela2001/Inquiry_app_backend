import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from 'src/entities/attachment.entity';
import { Inquiry } from 'src/entities/inquiry.entity';
import { Response } from 'src/entities/response.entity';
import { BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AttachmentsService {
  private uploadsDir = path.join(__dirname, '..', '..', 'uploads'); // Absolute path to /uploads

  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    @InjectRepository(Inquiry) private inquiryRepo: Repository<Inquiry>,
    @InjectRepository(Response) private responseRepo: Repository<Response>,
  ) {
    // Create /uploads if missing (run on startup)
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      console.log('Created uploads directory');
    }
  }

  async uploadToInquiry(
    file: Express.Multer.File,
    inquiryId: number,
  ): Promise<Attachment> {
    if (!file) throw new BadRequestException('File required');
    if (!file.buffer)
      throw new BadRequestException('File buffer missing—check Multer config'); // Debug

    console.log(
      'Uploading file:',
      file.originalname,
      'size:',
      file.size,
      'buffer length:',
      file.buffer?.length,
    ); // Debug

    const inquiry = await this.inquiryRepo.findOne({ where: { inquiryId } });
    if (!inquiry) throw new BadRequestException('Inquiry not found');

    // Save buffer to /uploads (rename for uniqueness)
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadsDir, fileName);
    fs.writeFileSync(filePath, file.buffer); // Now buffer defined

    const attachment = this.attachmentRepo.create({
      filePath, // e.g., '/path/to/project/uploads/1734567890123-cobra.jpg'
      inquiry, // Sets inquiry_id FK
    });
    return this.attachmentRepo.save(attachment);
  }

  async uploadToResponse(
    file: Express.Multer.File,
    responseId: number,
  ): Promise<Attachment> {
    if (!file) throw new BadRequestException('File required');
    if (!file.buffer)
      throw new BadRequestException('File buffer missing—check Multer config');

    console.log(
      'Uploading to response:',
      file.originalname,
      'size:',
      file.size,
    ); // Debug

    const response = await this.responseRepo.findOne({ where: { responseId } });
    if (!response) throw new BadRequestException('Response not found');

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadsDir, fileName);
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