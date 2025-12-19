import { Module } from '@nestjs/common';
import { RequestersService } from './requesters.service';
import { RequestersController } from './requesters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requester } from 'src/entities/requester.entity';
import { Rank } from 'src/entities/rank.entity';
import { Establishment } from 'src/entities/establishment.entity';
import { Inquiry } from 'src/entities/inquiry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Requester, Rank, Establishment, Inquiry]),
  ],
  providers: [RequestersService],
  controllers: [RequestersController],
  exports: [RequestersService],
})
export class RequestersModule {}
