import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requester } from 'src/entities/requester.entity';
import { Rank } from 'src/entities/rank.entity';
import { Establishment } from 'src/entities/establishment.entity';
import { Inquiry } from 'src/entities/inquiry.entity';
import { CreateRequesterDto } from './dto/create-requester.dto';
import { UpdateRequesterDto } from './dto/update-requester.dto';
import { RequesterType } from 'src/entities/requester.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { User, UserRole } from 'src/entities/user.entity';

@Injectable()
export class RequestersService {
  constructor(
    @InjectRepository(Requester) private requesterRepo: Repository<Requester>,
    @InjectRepository(Rank) private rankRepo: Repository<Rank>,
    @InjectRepository(Establishment)
    private estbRepo: Repository<Establishment>,
    @InjectRepository(Inquiry) private inquiryRepo: Repository<Inquiry>, // For linked filter
  ) {}

  async create(
    createDto: CreateRequesterDto,
    currentUser: User,
  ): Promise<Requester> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create requesters');
    }

    const newReq = createDto;
    // Validate army/civil (same as inquiries)
    if (
      newReq.requesterType === RequesterType.ARMY &&
      (!newReq.officerRegNo || newReq.nic || !newReq.rankId || !newReq.estbId)
    ) {
      throw new BadRequestException(
        'Army: Require officerRegNo, rankId, estbId only (no NIC)',
      );
    } else if (
      newReq.requesterType === RequesterType.CIVIL &&
      (newReq.officerRegNo || !newReq.nic)
    ) {
      throw new BadRequestException(
        'Civil: Require NIC only (no reg no; rankId/estbId optional)',
      );
    }

    // Load FKs
    let rank: Rank | null = null;
    if (newReq.rankId) {
      rank = await this.rankRepo.findOne({ where: { rank_id: newReq.rankId } });
      if (!rank) throw new BadRequestException('Invalid rank ID');
    }
    let establishment: Establishment | null = null;
    if (newReq.estbId) {
      establishment = await this.estbRepo.findOne({
        where: { estb_id: newReq.estbId },
      });
      if (!establishment)
        throw new BadRequestException('Invalid establishment ID');
    }

    // Check unique (reg_no or nic)
    const existing = await this.requesterRepo.findOne({
      where:
        newReq.requesterType === RequesterType.ARMY
          ? { officerRegNo: newReq.officerRegNo }
          : { nic: newReq.nic },
    });
    if (existing) throw new BadRequestException('Reg no or NIC already exists');

    const requester = this.requesterRepo.create(newReq);
    if (rank) requester.rank = rank;
    if (establishment) requester.establishment = establishment;
    return this.requesterRepo.save(requester);
  }

  async findAll(currentUser: User): Promise<Requester[]> {
    let where: any = {};
    if (currentUser.role === UserRole.OFFICER) {
      // Officer: Linked to own inquiries OR public
      where = {
        inquiries: { responses: { user: { userId: currentUser.userId } } },
      };
    } // Admin: All

    return this.requesterRepo.find({
      where,
      relations: ['rank', 'establishment', 'inquiries'], // Load FKs/inquiries
    });
  }

  async findOne(id: number, currentUser: User): Promise<Requester> {
    let where: any = { requesterId: id };
    if (currentUser.role === UserRole.OFFICER) {
      where = {
        requesterId: id,
        inquiries: { responses: { user: { userId: currentUser.userId } } },
      };
    }

    const requester = await this.requesterRepo.findOne({
      where,
      relations: ['rank', 'establishment', 'inquiries'],
    });
    if (!requester)
      throw new ForbiddenException('Requester not found or access denied');
    return requester;
  }

  async update(
    id: number,
    updateDto: UpdateRequesterDto,
    currentUser: User,
  ): Promise<Requester> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update requesters');
    }

    const requester = await this.requesterRepo.findOne({
      where: { requesterId: id },
    });
    if (!requester) throw new ForbiddenException('Requester not found');

    // Validate changes (same army/civil)
    // ... (reuse validation from create)

    Object.assign(requester, updateDto);
    return this.requesterRepo.save(requester);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete requesters');
    }

    const requester = await this.requesterRepo.findOne({
      where: { requesterId: id },
      relations: ['inquiries'],
    });
    if (!requester) throw new ForbiddenException('Requester not found');
    if (requester.inquiries && requester.inquiries.length > 0) {
      throw new ForbiddenException(
        'Cannot delete requester with active inquiries',
      );
    }
    await this.requesterRepo.remove(requester);
  }
}
