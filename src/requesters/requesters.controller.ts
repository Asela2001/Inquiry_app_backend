import { Controller } from '@nestjs/common';
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
import { RequestersService } from './requesters.service';
import { CreateRequesterDto } from './dto/create-requester.dto';
import { UpdateRequesterDto } from './dto/update-requester.dto';

@Controller('requesters')
@UseGuards(JwtAuthGuard) // All protected
export class RequestersController {
  constructor(private readonly requestersService: RequestersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createDto: CreateRequesterDto, @Req() req) {
    return this.requestersService.create(createDto, req.user);
  }

  @Get()
  findAll(@Req() req) {
    return this.requestersService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.requestersService.findOne(+id, req.user);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRequesterDto,
    @Req() req,
  ) {
    return this.requestersService.update(+id, updateDto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req) {
    return this.requestersService.remove(+id, req.user);
  }

  // Get all inquiries for a specific requester
  @Get(':id/inquiries')
  async getInquiries(@Param('id') id: number, @Req() req) {
    const requester = await this.requestersService.findOne(id, req.user);
    return this.requestersService.getInquiriesByRequester(id);
  }
}
