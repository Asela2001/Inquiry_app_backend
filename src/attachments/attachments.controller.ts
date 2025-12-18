import { Controller } from '@nestjs/common';
import {
  Body,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('attachments')
@UseGuards(JwtAuthGuard) // Protected uploads (officer/admin)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('inquiry/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OFFICER) // Officer attaches to own/public
  @UseInterceptors(FileInterceptor('file')) // 'file' key in form-data
  uploadToInquiry(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    return this.attachmentsService.uploadToInquiry(file, +id);
  }

  @Post('response/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OFFICER)
  @UseInterceptors(FileInterceptor('file'))
  uploadToResponse(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    return this.attachmentsService.uploadToResponse(file, +id);
  }

  @Get('inquiry/:id')
  findByInquiry(@Param('id') id: string) {
    return this.attachmentsService.findByInquiry(+id);
  }

  @Get('response/:id')
  findByResponse(@Param('id') id: string) {
    return this.attachmentsService.findByResponse(+id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Admin deletes
  delete(@Param('id') id: string) {
    return this.attachmentsService.delete(+id);
  }
}
