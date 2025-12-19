import {
  Controller,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
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
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDto: CreateInquiryDto, @Req() req) {
    return this.inquiriesService.create(createDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  // @UseGuards(RolesGuard)
  // Admin: All; Officer: Auto-filtered in service
  findAll(@Req() req) {
    return this.inquiriesService.findAll(req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInquiryDto,
    @Req() req,
  ) {
    return this.inquiriesService.update(+id, updateDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    return this.inquiriesService.remove(+id, req.user);
  }

  @Get('dashboard') // e.g., /inquiries/dashboard
  @UseGuards(JwtAuthGuard)
  getDashboard(@Req() req) {
    return this.inquiriesService.getDashboard(req.user); // Returns stats object
  }

  @Post('public')
  @UseGuards(ThrottlerGuard) // Rate-limit only
  @UseInterceptors(
    FilesInterceptor('attachments', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName =
            'inq_' +
            Date.now() +
            '_' +
            Math.round(Math.random() * 1e9) +
            extname(file.originalname);

          cb(null, uniqueName);
        },
      }),
    }),
  )
  createPublic(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('data') data: string,
  ) {
    const createDto: CreateInquiryDto = JSON.parse(data);
    return this.inquiriesService.createPublic(createDto, files);
  }

  // Dashboard Charts
  @Get('charts/categories')
  getCategoryDistribution() {
    return this.inquiriesService.getCategoryDistribution();
  }

  @Get('charts/yearly/:year')
  getYearlyCounts(@Param('year') year: string) {
    return this.inquiriesService.getMonthlyInquiryCounts(+year);
  }

  @Get(':id/responses')
  @UseGuards(JwtAuthGuard) // Protected
  findResponsesByInquiry(@Param('id') id: string, @Req() req) {
    return this.inquiriesService.findResponsesByInquiry(+id, req.user); // New service method
  }

  @Get('responses/user/:id')
  @UseGuards(JwtAuthGuard) // Token required
  findResponsesByUser(@Param('id') id: string, @Req() req) {
    return this.inquiriesService.findResponsesByUser(+id, req.user);
  }
}
