import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from 'src/auth/dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from 'src/auth/dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    // Check if email exists
    const existing = await this.userRepository.findOne({
      where: { uEmail: dto.uEmail },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user (role from DTO; admin sets 'officer' for new ones)
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    await this.userRepository.save(user);
    return {
      message:
        'User created successfully. Provide credentials securely to officer.',
    };
  }

  async signin(dto: SigninDto) {
    const user = await this.userRepository.findOne({
      where: { uEmail: dto.uEmail },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate token payload
    const payload = { sub: user.userId, email: user.uEmail, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Return token + basic user (no password)
    const { password: _, ...safeUser } = user;
    return {
      access_token: accessToken,
      user: safeUser,
    };
  }
}
