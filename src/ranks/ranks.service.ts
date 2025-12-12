import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rank } from '../entities/rank.entity';
import { Requester } from 'src/entities/requester.entity';
import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';
import { ForbiddenException } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/user.entity';

@Injectable()
export class RanksService {
  constructor(
    @InjectRepository(Rank)
    private rankRepo: Repository<Rank>,
    @InjectRepository(Requester)
    private requesterRepo: Repository<Requester>, // For in-use check
  ) {}

  async create(createDto: CreateRankDto, currentUser: User): Promise<Rank> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create ranks');
    }
    // Use snake_case for where (matches entity property)
    const existing = await this.rankRepo.findOne({
      where: { rank_name: createDto.rankName },
    });
    if (existing) throw new ForbiddenException('Rank name must be unique');

    // Map DTO camelCase to entity snake_case
    const entityDto = {
      rank_name: createDto.rankName,
      description: createDto.description,
    };

    const rank = this.rankRepo.create(entityDto);
    return this.rankRepo.save(rank);
  }

  async findAll(): Promise<Rank[]> {
    return this.rankRepo.find({ relations: ['requesters'] }); // Load count of linked requesters for admin overview
  }

  async findOne(id: number): Promise<Rank> {
    const rank = await this.rankRepo.findOne({
      where: { rank_id: id },
      relations: ['requesters'], // Show linked requesters for detail
    });
    if (!rank) throw new ForbiddenException('Rank not found');
    return rank;
  }

  async update(
    id: number,
    updateDto: UpdateRankDto,
    currentUser: User,
  ): Promise<Rank> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update ranks');
    }
    const rank = await this.findOne(id); // Reuses for exists check
    Object.assign(rank, updateDto);
    // Re-check unique if name changed (map camel to snake)
    if (updateDto.rankName && updateDto.rankName !== rank.rank_name) {
      const existing = await this.rankRepo.findOne({
        where: { rank_name: updateDto.rankName },
      });
      if (existing) throw new ForbiddenException('Rank name must be unique');
    }
    rank.rank_name = updateDto.rankName || rank.rank_name; // Explicit assign if changed
    return this.rankRepo.save(rank);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete ranks');
    }
    const rank = await this.findOne(id);
    // Check if in use (via requesters relation)
    if (rank.requesters && rank.requesters.length > 0) {
      throw new ForbiddenException('Cannot delete rank in use by requesters');
    }
    await this.rankRepo.remove(rank);
  }
}