import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { User, UserRole } from '../entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async create(
    createDto: CreateCategoryDto,
    currentUser: User,
  ): Promise<Category> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create categories');
    }
    // Check unique name
    const existing = await this.categoryRepo.findOne({
      where: { categoryName: createDto.categoryName },
    });
    if (existing) throw new ForbiddenException('Category name must be unique');

    const category = this.categoryRepo.create(createDto);
    return this.categoryRepo.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.find({ relations: ['inquiries'] }); // Optional: Load count of linked inquiries for admin overview
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { categoryId: id },
      relations: ['inquiries'], // Show linked inquiries for detail
    });
    if (!category) throw new ForbiddenException('Category not found');
    return category;
  }

  async update(
    id: number,
    updateDto: UpdateCategoryDto,
    currentUser: User,
  ): Promise<Category> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update categories');
    }
    const category = await this.findOne(id); // Reuses findOne for exists check
    Object.assign(category, updateDto);
    // Re-check unique if name changed
    if (
      updateDto.categoryName &&
      updateDto.categoryName !== category.categoryName
    ) {
      const existing = await this.categoryRepo.findOne({
        where: { categoryName: updateDto.categoryName },
      });
      if (existing)
        throw new ForbiddenException('Category name must be unique');
    }
    return this.categoryRepo.save(category);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete categories');
    }
    const category = await this.findOne(id);
    // Check if in use (RESTRICT on schema prevents DB error)
    if (category.inquiries && category.inquiries.length > 0) {
      throw new ForbiddenException(
        'Cannot delete category in use by inquiries',
      );
    }
    await this.categoryRepo.remove(category);
  }
}
