import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createDto: CreateUserDto, @Req() req) {
    return this.usersService.create(createDto, req.user);
  }

  @Get()
  findAll(@Req() req) {
    return this.usersService.findAll(req.user);
  }

  @Get('profile') // Self-profile—no param, no pipe
  getProfile(@Req() req) {
    return this.usersService.getProfile(req.user);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Body() changeDto: ChangePasswordDto, @Req() req) {
    return this.usersService.changePassword(
      req.user.userId,
      changeDto,
      req.user,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.usersService.findOne(id, req.user);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @Req() req,
  ) {
    return this.usersService.update(+id, updateDto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(+id, req.user);
  }
}
