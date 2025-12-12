import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Establishment } from 'src/entities/establishment.entity';
import { Requester } from 'src/entities/requester.entity';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { ForbiddenException } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/user.entity';

@Injectable()
export class EstablishmentsService {
  constructor(
    @InjectRepository(Establishment)
    private estbRepo: Repository<Establishment>,
    @InjectRepository(Requester)
    private requesterRepo: Repository<Requester>, // For in-use check
  ) {}

  async create(
    createDto: CreateEstablishmentDto,
    currentUser: User,
  ): Promise<Establishment> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create establishments');
    }
    // Use snake_case for where (matches entity property)
    const existing = await this.estbRepo.findOne({
      where: { estb_name: createDto.estbName },
    });
    if (existing)
      throw new ForbiddenException('Establishment name must be unique');

    // Map DTO camelCase to entity snake_case
    const entityDto = {
      estb_name: createDto.estbName,
      estb_type: createDto.estbType,
    };

    const estb = this.estbRepo.create(entityDto);
    return this.estbRepo.save(estb);
  }

  async findAll(): Promise<Establishment[]> {
    return this.estbRepo.find({ relations: ['requesters'] }); // Load count of linked requesters for admin overview
  }

  async findOne(id: number): Promise<Establishment> {
    const estb = await this.estbRepo.findOne({
      where: { estb_id: id },
      relations: ['requesters'], // Show linked requesters for detail
    });
    if (!estb) throw new ForbiddenException('Establishment not found');
    return estb;
  }

  async update(
    id: number,
    updateDto: UpdateEstablishmentDto,
    currentUser: User,
  ): Promise<Establishment> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update establishments');
    }
    const estb = await this.findOne(id); // Reuses for exists check
    // Map DTO camelCase to entity snake_case if provided
    if (updateDto.estbName !== undefined) estb.estb_name = updateDto.estbName;
    if (updateDto.estbType !== undefined) estb.estb_type = updateDto.estbType;

    // Re-check unique if name changed
    if (updateDto.estbName && updateDto.estbName !== estb.estb_name) {
      const existing = await this.estbRepo.findOne({
        where: { estb_name: updateDto.estbName },
      });
      if (existing)
        throw new ForbiddenException('Establishment name must be unique');
    }
    return this.estbRepo.save(estb);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete establishments');
    }
    const estb = await this.findOne(id);
    // Check if in use (via requesters relation)
    if (estb.requesters && estb.requesters.length > 0) {
      throw new ForbiddenException(
        'Cannot delete establishment in use by requesters',
      );
    }
    await this.estbRepo.remove(estb);
  }
}