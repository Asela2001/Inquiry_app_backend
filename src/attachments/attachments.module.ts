import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from 'src/entities/attachment.entity';
import { Inquiry } from 'src/entities/inquiry.entity';
import { Response } from 'src/entities/response.entity';
import { MulterModule } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';
import * as multer from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment, Inquiry, Response]),
    MulterModule.register({
      storage: multer.memoryStorage(), // Fix: Proper memory storage instance—file.buffer available
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
      fileFilter: (req, file, cb) => {
        // Allow PDF/images only
        if (
          file.mimetype.startsWith('image/') ||
          file.mimetype === 'application/pdf'
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Invalid file type (PDF or image only)'),
            false,
          );
        }
      },
    }),
  ],
  providers: [AttachmentsService],
  controllers: [AttachmentsController],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
