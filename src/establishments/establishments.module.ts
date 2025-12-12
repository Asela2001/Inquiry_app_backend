import { Module } from '@nestjs/common';
import { EstablishmentsService } from './establishments.service';
import { EstablishmentsController } from './establishments.controller';
import { Requester } from 'src/entities/requester.entity';
import { Establishment } from 'src/entities/establishment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Establishment, Requester])],
  providers: [EstablishmentsService],
  controllers: [EstablishmentsController],
  exports: [EstablishmentsService],
})
export class EstablishmentsModule {}
