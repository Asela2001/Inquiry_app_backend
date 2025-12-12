import { Controller } from '@nestjs/common';
import {
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EstablishmentsService } from './establishments.service';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';

@Controller('establishments')
//@UseGuards(JwtAuthGuard)
export class EstablishmentsController {
  constructor(private readonly establishmentsService: EstablishmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createDto: CreateEstablishmentDto, @Req() req) {
    return this.establishmentsService.create(createDto, req.user);
  }

  @Get()
  findAll() {
    return this.establishmentsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.establishmentsService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEstablishmentDto,
    @Req() req,
  ) {
    return this.establishmentsService.update(+id, updateDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req) {
    return this.establishmentsService.remove(+id, req.user);
  }
}
