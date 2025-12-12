import { Module } from '@nestjs/common';
import { RanksService } from './ranks.service';
import { RanksController } from './ranks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rank } from 'src/entities/rank.entity';
import { Requester } from 'src/entities/requester.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rank, Requester])],
  providers: [RanksService],
  controllers: [RanksController],
  exports: [RanksService],
})
export class RanksModule {}
