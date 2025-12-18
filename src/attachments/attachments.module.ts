import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from 'src/entities/attachment.entity';
import { Inquiry } from 'src/entities/inquiry.entity';
import { Response } from 'src/entities/response.entity';
import { MulterModule } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment, Inquiry, Response]),
    MulterModule.register({
      dest: './uploads', // Local storage (prod: AWS S3 config)
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
      fileFilter: (req, file, cb) => {
        // Optional: Allow PDF, JPG, PNG only
        if (
          file.mimetype.startsWith('image/') ||
          file.mimetype === 'application/pdf'
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  ],
  providers: [AttachmentsService],
  controllers: [AttachmentsController],
})
export class AttachmentsModule {}
