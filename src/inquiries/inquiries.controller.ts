import { Controller } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { InquiriesService } from './inquiries.service';
import {
  Body,
  Post,
  Req,
  Get,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from 'src/common/guards/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('inquiries')
@UseGuards(JwtAuthGuard)
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  create(@Body() createDto: CreateInquiryDto, @Req() req) {
    return this.inquiriesService.create(createDto, req.user);
  }

  @Get()
  // @UseGuards(RolesGuard)
  // Admin: All; Officer: Auto-filtered in service
  findAll(@Req() req) {
    return this.inquiriesService.findAll(req.user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInquiryDto,
    @Req() req,
  ) {
    return this.inquiriesService.update(+id, updateDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.inquiriesService.remove(+id, req.user);
  }

  @Get('dashboard') // e.g., /inquiries/dashboard
  getDashboard(@Req() req) {
    return this.inquiriesService.getDashboard(req.user); // Returns stats object
  }

  @Post('public')
  @UseGuards(ThrottlerGuard) // Rate-limit only
  createPublic(@Body() createDto: CreateInquiryDto) {
    return this.inquiriesService.createPublic(createDto);
  }
}