import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Inquiry } from '../entities/inquiry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Inquiry]), // Provides CategoryRepository + Inquiry for relations
  ],
  providers: [CategoriesService],
  controllers: [CategoriesController],
})
export class CategoriesModule {}
