import { Controller } from '@nestjs/common';
import {
  Body,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('categories')
@UseGuards(JwtAuthGuard) // All: Auth required (officer/admin token)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post() // Add new
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createDto: CreateCategoryDto, @Req() req) {
    return this.categoriesService.create(createDto, req.user);
  }

  @Get() // List all (for dropdown/officer view)
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id') // Detail
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Put(':id') // Update
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryDto,
    @Req() req,
  ) {
    return this.categoriesService.update(+id, updateDto, req.user);
  }

  @Delete(':id') // Delete
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req) {
    return this.categoriesService.remove(+id, req.user);
  }
}
