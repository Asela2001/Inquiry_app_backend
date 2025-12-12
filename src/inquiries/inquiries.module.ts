import { Module } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { User } from 'src/entities/user.entity';
import { Category } from 'src/entities/category.entity';
import { Requester } from 'src/entities/requester.entity';
import { Inquiry } from 'src/entities/inquiry.entity';
import { Response } from 'src/entities/response.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from 'src/email/email.module';
import { Establishment } from 'src/entities/establishment.entity';
import { Rank } from 'src/entities/rank.entity';

@Module({
  providers: [InquiriesService],
  controllers: [InquiriesController],
  imports: [
    TypeOrmModule.forFeature([
      Inquiry,
      Requester,
      Category,
      Response,
      User,
      Rank,
      Establishment,
    ]),
    EmailModule,
  ],
  exports: [InquiriesService],
})
export class InquiriesModule {}
