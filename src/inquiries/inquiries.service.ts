import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry } from '../entities/inquiry.entity';
import { Requester } from 'src/entities/requester.entity';
import { Category } from 'src/entities/category.entity';
import { User } from 'src/entities/user.entity';
import { Response } from 'src/entities/response.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { InquiryStatus } from 'src/entities/inquiry.entity';
import { RequesterType } from 'src/entities/requester.entity';
import { UserRole } from 'src/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { EmailService } from 'src/email/email.service';
import { Rank } from 'src/entities/rank.entity';
import { Establishment } from 'src/entities/establishment.entity';
import { Attachment } from 'src/entities/attachment.entity';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry) private inquiryRepo: Repository<Inquiry>,
    @InjectRepository(Requester) private requesterRepo: Repository<Requester>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Response) private responseRepo: Repository<Response>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Rank) private rankRepo: Repository<Rank>, // New repo for FK
    @InjectRepository(Establishment)
    private estbRepo: Repository<Establishment>,
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    private emailService: EmailService, // For notifications
  ) {}

  async create(
    createDto: CreateInquiryDto,
    currentUser: User,
  ): Promise<Inquiry> {
    // Validate category exists
    const category = await this.categoryRepo.findOne({
      where: { categoryId: createDto.categoryId },
    });
    if (!category) throw new BadRequestException('Invalid category ID');

    // Handle requester: New or existing
    let requester: Requester;
    if (createDto.requesterId) {
      const found = await this.requesterRepo.findOne({
        where: { requesterId: createDto.requesterId },
      });
      if (!found) {
        throw new BadRequestException('Invalid requester ID');
      }
      requester = found;
    } else if (createDto.newRequester) {
      const newReq = createDto.newRequester;
      // Validate army/civil logic (digital check for manual errors)
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

      // Load Rank/Establishment if IDs provided (for relation set)
      let rank: Rank | null = null;
      if (newReq.rankId) {
        rank = await this.rankRepo.findOne({
          where: { rank_id: newReq.rankId },
        });
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

      // Create base requester
      requester = this.requesterRepo.create(newReq);
      // Set relations after create (avoids DeepPartial error)
      if (rank) {
        requester.rank = rank;
      }
      if (establishment) {
        requester.establishment = establishment;
      }
      await this.requesterRepo.save(requester);
    } else {
      throw new BadRequestException(
        'Provide requester ID or new details from call',
      );
    }

    // Create inquiry (default 'pending')
    const inquiry = this.inquiryRepo.create({
      ...createDto,
      status: createDto.status || InquiryStatus.PENDING,
      category,
      requester,
    });
    await this.inquiryRepo.save(inquiry);

    // Auto-create initial response for officer assignment (tracks who handles)
    const initialResponse = this.responseRepo.create({
      responseText: `Inquiry assigned to ${currentUser.uFirstName} ${currentUser.uLastName}`,
      inquiry,
      user: currentUser,
    });
    await this.responseRepo.save(initialResponse);

    // Send confirmation email if rEmail exists
    if (requester.rEmail) {
      try {
        await this.emailService.sendInquiryConfirmation(
          requester.rEmail,
          inquiry.inquiryId,
          inquiry.subject,
          inquiry.inquiryText.substring(0, 100) + '...', // Brief summary
        );
      } catch (emailError) {
        console.error('Email confirmation failed:', emailError); // Log, don't block
      }
    } // Else, log "No email—use phoneNo for SMS future"

    return inquiry;
  }

  async findAll(currentUser: User): Promise<Inquiry[]> {
    //const where: any = {};
    let where: any = {};
    if (currentUser.role === UserRole.OFFICER) {
      // Officer: Only own (via responses)
      where = [
        { responses: { user: { userId: currentUser.userId } } }, // Own assigned
        { isPublic: true }, // All public (pending/unassigned)
      ];
    } // Admin: All (no where)

    const inquiries = await this.inquiryRepo.find({
      where,
      relations: ['requester', 'category', 'responses', 'responses.user'],
    });
    return plainToInstance(Inquiry, inquiries); // Safe transform
  }

  async update(
    id: number,
    updateDto: UpdateInquiryDto,
    currentUser: User,
  ): Promise<Inquiry> {
    let where: any = { inquiryId: id };
    if (currentUser.role === UserRole.OFFICER) {
      // Officer: Own OR public (OR filter)
      where = [
        { inquiryId: id, responses: { user: { userId: currentUser.userId } } },
        { inquiryId: id, isPublic: true },
      ];
    } // Admin: Any (no extra)

    const inquiry = await this.inquiryRepo.findOne({
      where,
      relations: ['responses', 'requester'], // Load for email
    });
    if (!inquiry)
      throw new ForbiddenException('Inquiry not found or access denied');

    const previousStatus = inquiry.status; // Track for change

    // Update fields
    Object.assign(inquiry, updateDto);
    if (updateDto.status) inquiry.status = updateDto.status; // Enforce enum

    await this.inquiryRepo.save(inquiry);

    // Add response if text provided (digital update log)
    if (updateDto.responseText) {
      const response = this.responseRepo.create({
        responseText: updateDto.responseText,
        inquiry,
        user: currentUser,
      });
      await this.responseRepo.save(response);
    }

    // Send completion email if status changed to resolved/closed
    if (
      (updateDto.status === InquiryStatus.RESOLVED ||
        updateDto.status === InquiryStatus.CLOSED) &&
      inquiry.requester.rEmail &&
      inquiry.status !== previousStatus
    ) {
      try {
        await this.emailService.sendInquiryCompletion(
          inquiry.requester.rEmail,
          id,
          inquiry.subject,
        );
      } catch (emailError) {
        console.error('Email completion failed:', emailError); // Log, don't block
      }
    }

    return inquiry;
  }

  async remove(id: number, currentUser: User): Promise<void> {
    let where: any = { inquiryId: id };
    if (currentUser.role === UserRole.OFFICER) {
      // Officer: Own OR public (OR filter)
      where = [
        { inquiryId: id, responses: { user: { userId: currentUser.userId } } },
        { inquiryId: id, isPublic: true },
      ];
    } // Admin: Any (no extra)

    const inquiry = await this.inquiryRepo.findOne({ where });
    if (!inquiry)
      throw new ForbiddenException('Inquiry not found or access denied');

    await this.inquiryRepo.remove(inquiry); // Cascades to responses/attachments
  }

  async getDashboard(currentUser: User): Promise<any> {
    let query = this.inquiryRepo.createQueryBuilder('i');

    // Officer: Subquery EXISTS for ownership (boolean, no dupes)
    if (currentUser.role === UserRole.OFFICER) {
      query = query.where(
        'EXISTS (SELECT 1 FROM response res JOIN "user" u ON res.user_id = u.user_id WHERE res.inquiry_id = i.inquiry_id AND u.user_id = :userId)',
        { userId: currentUser.userId },
      );
    } else if (currentUser.role === UserRole.ADMIN) {
      // Explicit admin branch—no filter
    } else {
      throw new ForbiddenException('Invalid role for dashboard access');
    }

    const stats = await query
      .select('i.status, COUNT(DISTINCT i.inquiry_id) AS count')
      .groupBy('i.status')
      .getRawMany();

    const result: any = { pending: 0, in_progress: 0, resolved: 0, closed: 0 };
    stats.forEach((row: any) => {
      result[row.status] = parseInt(row.count, 10);
    });

    result.total = Object.values(result).reduce(
      (sum: number, val: number) => sum + val,
      0,
    );

    return result;
  }

  async createPublic(
    createDto: CreateInquiryDto,
    files: Express.Multer.File[],
  ): Promise<Inquiry> {
    // Reuse validation/create logic (no currentUser)
    const category = await this.categoryRepo.findOne({
      where: { categoryId: createDto.categoryId },
    });
    if (!category) throw new BadRequestException('Invalid category ID');

    const newReq = createDto.newRequester;
    if (!newReq) throw new BadRequestException('Requester details required');
    let requester: Requester | null = null;

    if (newReq.requesterType === RequesterType.ARMY && newReq.officerRegNo) {
      requester = await this.requesterRepo.findOne({
        where: { officerRegNo: newReq.officerRegNo },
      });
    }

    if (
      !requester &&
      newReq.requesterType === RequesterType.CIVIL &&
      newReq.nic
    ) {
      requester = await this.requesterRepo.findOne({
        where: { nic: newReq.nic },
      });
    }

    if (!requester && newReq.rEmail) {
      requester = await this.requesterRepo.findOne({
        where: { rEmail: newReq.rEmail },
      });
    }

    if (!requester) {
      // Load FKs (same as before)
      let rank: Rank | null = null;
      if (newReq.rankId) {
        rank = await this.rankRepo.findOne({
          where: { rank_id: newReq.rankId },
        });
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

      requester = this.requesterRepo.create(newReq);
      if (rank) requester.rank = rank;
      if (establishment) requester.establishment = establishment;
      await this.requesterRepo.save(requester);
    }

    // Create inquiry (auto 'pending', no response assignment—admin/officer assigns later)
    const inquiry = this.inquiryRepo.create({
      ...createDto,
      status: InquiryStatus.PENDING, // Force pending for public
      isPublic: true,
      category,
      requester,
    });
    await this.inquiryRepo.save(inquiry);

    if (files && files.length > 0) {
      for (const file of files) {
        const attachment = this.attachmentRepo.create({
          filePath: `/uploads/${file.filename}`,
          inquiry,
        });
        await this.attachmentRepo.save(attachment);
      }
    }

    // Send confirmation email (no assignment response)
    if (requester.rEmail) {
      try {
        await this.emailService.sendInquiryConfirmation(
          requester.rEmail,
          inquiry.inquiryId,
          inquiry.subject,
          inquiry.inquiryText.substring(0, 100) + '...',
        );
      } catch (emailError) {
        console.error('Email confirmation failed:', emailError);
      }
    }

    return inquiry;
  }

  // Dashboard Charts
  async getCategoryDistribution(): Promise<
    { category: string; count: number }[]
  > {
    const result = await this.inquiryRepo
      .createQueryBuilder('i')
      .leftJoin('i.category', 'c')
      .select('c.category_name', 'category')
      .addSelect('COUNT(i.inquiry_id)', 'count')
      .groupBy('c.category_name')
      .getRawMany();
    return result.map((r) => ({
      category: r.category,
      count: parseInt(r.count, 10),
    }));
  }

  async getMonthlyInquiryCounts(
    year: number,
  ): Promise<{ month: number; count: number }[]> {
    const result = await this.inquiryRepo
      .createQueryBuilder('i')
      .select('EXTRACT(MONTH FROM i.i_created_at)', 'month')
      .addSelect('COUNT(i.inquiry_id)', 'count')
      .where('EXTRACT(YEAR FROM i.i_created_at) = :year', { year })
      .groupBy('month')
      .orderBy('month')
      .getRawMany();
    // Fill missing months with 0
    const months: { month: number; count: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const found = result.find((r) => parseInt(r.month, 10) === m);
      months.push({ month: m, count: found ? parseInt(found.count, 10) : 0 });
    }
    return months;
  }

  async findResponsesByInquiry(
    id: number,
    currentUser: User,
  ): Promise<Response[]> {
    // Reuse ownership logic (own or public)
    const inquiry = await this.inquiryRepo.findOne({
      where: { inquiryId: id }, // Add OR for officer if public
      relations: ['responses', 'responses.user'],
    });
    if (!inquiry) throw new ForbiddenException('Inquiry not found');
    return inquiry.responses;
  }

  async findResponsesByUser(
    userId: number,
    currentUser: User,
  ): Promise<Response[]> {
    // Role check: Officer sees own; admin sees any
    if (
      currentUser.role === UserRole.OFFICER &&
      currentUser.userId !== userId
    ) {
      throw new ForbiddenException(
        'Officers can only view their own responses',
      );
    }

    const responses = await this.responseRepo.find({
      where: { user: { userId } },
      relations: ['user', 'inquiry', 'inquiry.requester', 'inquiry.category'], // Load context (user, inquiry details)
      order: { rCreatedAt: 'DESC' },
    });

    if (responses.length === 0) {
      throw new NotFoundException('No responses found for this user');
    }

    return responses; // Array with full details
  }

  async findOne(id: number, currentUser: User): Promise<Inquiry> {
    const numericId = Number(id);
    if (!numericId || isNaN(numericId)) {
      throw new BadRequestException('Invalid inquiry ID');
    }

    let where: any = { inquiryId: numericId };
    if (currentUser.role === UserRole.OFFICER) {
      where = [
        {
          inquiryId: numericId,
          responses: { user: { userId: currentUser.userId } },
        },
        { inquiryId: numericId, isPublic: true },
      ];
    }
    const inquiry = await this.inquiryRepo.findOne({
      where,
      relations: [
        'requester',
        'category',
        'attachments',
        'responses',
        'responses.user',
      ],
    });
    if (!inquiry)
      throw new NotFoundException('Inquiry not found or access denied');
    return inquiry;
  }

  // Post response to an inquiry
  async createResponse(
    inquiryId: number,
    responseText: string,
    files: Express.Multer.File[],
    currentUser: User,
  ) {
    const inquiry = await this.inquiryRepo.findOne({
      where: { inquiryId },
      relations: ['responses', 'attachments'],
    });
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    inquiry.status = InquiryStatus.RESOLVED;
    await this.inquiryRepo.save(inquiry);
    const response = this.responseRepo.create({
      responseText,
      inquiry,
      user: currentUser,
    });
    await this.responseRepo.save(response);
    if (files && files.length > 0) {
      for (const file of files) {
        const attachment = this.attachmentRepo.create({
          filePath: `/uploads/${file.filename}`,
          response, // Link attachment to response
        });
        await this.attachmentRepo.save(attachment);
      }
    }
    return response;
  }

  // Inquiry status update to in progress
  async markInProgress(id: number, currentUser: User): Promise<Inquiry> {
    const inquiry = await this.inquiryRepo.findOne({
      where: { inquiryId: id },
      relations: ['responses'],
    });
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    if (inquiry.status === InquiryStatus.PENDING) {
      inquiry.status = InquiryStatus.IN_PROGRESS;
      await this.inquiryRepo.save(inquiry);
    }
    return inquiry;
  }
}
