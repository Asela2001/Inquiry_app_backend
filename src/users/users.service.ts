import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForbiddenException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private authService: AuthService, // For other auth logic if needed
  ) {}

  async findAll(currentUser: User): Promise<any[]> {
    const where: any =
      currentUser.role === UserRole.OFFICER
        ? { userId: currentUser.userId }
        : {}; // Officer: Own only
    const users = await this.userRepo.find({ where }); // No relations needed for view

    // Sanitize: Hide password/responses (simple map—no DTO needed)
    return users.map((user) => ({
      userId: user.userId,
      uFirstName: user.uFirstName,
      uLastName: user.uLastName,
      department: user.department,
      uEmail: user.uEmail,
      role: user.role,
      // Excludes password, responses automatically
    }));
  }

  async findOne(id: number, currentUser: User): Promise<any> {
    const where: any =
      currentUser.role === UserRole.OFFICER
        ? { userId: currentUser.userId }
        : { userId: id };
    const user = await this.userRepo.findOne({ where });
    if (!user) throw new ForbiddenException('User not found or access denied');

    // Sanitize single
    return {
      userId: user.userId,
      uFirstName: user.uFirstName,
      uLastName: user.uLastName,
      department: user.department,
      uEmail: user.uEmail,
      role: user.role,
    };
  }

  async create(createDto: CreateUserDto, currentUser: User): Promise<any> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create users');
    }

    const existing = await this.userRepo.findOne({
      where: { uEmail: createDto.uEmail },
    });
    if (existing) throw new ForbiddenException('Email already registered');

    // Inline hashing
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    const user = this.userRepo.create({
      ...createDto,
      password: hashedPassword,
      role: UserRole.OFFICER,
    });
    await this.userRepo.save(user);

    // Sanitize return
    const { password, responses, ...safeUser } = user;
    return safeUser;
  }

  async update(
    id: number,
    updateDto: UpdateUserDto,
    currentUser: User,
  ): Promise<any> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update users');
    }

    const user = await this.userRepo.findOne({ where: { userId: id } });
    if (!user) throw new ForbiddenException('User not found');

    // Hash password only if provided (and it's a string)
    if (updateDto.password && typeof updateDto.password === 'string') {
      updateDto.password = (await bcrypt.hash(updateDto.password, 10)) as any;
    }

    Object.assign(user, updateDto);
    await this.userRepo.save(user);

    // Sanitize return
    const { password, responses, ...safeUser } = user;
    return safeUser;
  }

  async remove(id: number, currentUser: User): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    const user = await this.userRepo.findOne({ where: { userId: id } });
    if (!user) throw new ForbiddenException('User not found');

    // Load relations to check in-use
    const fullUser = await this.userRepo.findOne({
      where: { userId: id },
      relations: ['responses'],
    });
    if (fullUser && fullUser.responses && fullUser.responses.length > 0) {
      throw new ForbiddenException(
        'Cannot delete user with active inquiries/responses',
      );
    }

    await this.userRepo.remove(user);
  }
}
