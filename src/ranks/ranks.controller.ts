import { Controller } from '@nestjs/common';
import { RanksService } from './ranks.service';
import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';
import {
  Body,
  Post,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';

@Controller('ranks')
//@UseGuards(JwtAuthGuard) // All: Auth required
export class RanksController {
  constructor(private readonly ranksService: RanksService) {}

  @Post() // Add new
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createDto: CreateRankDto, @Req() req) {
    return this.ranksService.create(createDto, req.user);
  }

  @Get() // List all (for dropdown)
  findAll() {
    return this.ranksService.findAll();
  }

  @Get(':id') // Detail
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Admin only for detail (requesters load)
  findOne(@Param('id') id: string) {
    return this.ranksService.findOne(+id);
  }

  @Put(':id') // Update
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRankDto,
    @Req() req,
  ) {
    return this.ranksService.update(+id, updateDto, req.user);
  }

  @Delete(':id') // Delete
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req) {
    return this.ranksService.remove(+id, req.user);
  }
}
