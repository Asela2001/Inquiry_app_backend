import { Module } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { User } from 'src/entities/user.entity';
import { Category } from 'src/entities/category.entity';
import { Requester } from 'src/entities/requester.entity';
import { Inquiry } from 'src/entities/inquiry.entity';
import { Response } from 'src/entities/response.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [InquiriesService],
  controllers: [InquiriesController],
  imports: [
    TypeOrmModule.forFeature([Inquiry, Requester, Category, Response, User]),
  ],
  exports: [InquiriesService],
})
export class InquiriesModule {}
