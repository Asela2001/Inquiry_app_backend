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

@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry) private inquiryRepo: Repository<Inquiry>,
    @InjectRepository(Requester) private requesterRepo: Repository<Requester>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Response) private responseRepo: Repository<Response>,
    @InjectRepository(User) private userRepo: Repository<User>,
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
        (!newReq.officerRegNo || newReq.nic)
      ) {
        throw new BadRequestException(
          'Army: Require officerRegNo only (no NIC)',
        );
      } else if (
        newReq.requesterType === RequesterType.CIVIL &&
        (newReq.officerRegNo || !newReq.nic)
      ) {
        throw new BadRequestException('Civil: Require NIC only (no reg no)');
      }
      requester = this.requesterRepo.create(newReq);
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

    return inquiry;
  }

  async findAll(currentUser: User): Promise<Inquiry[]> {
    const where: any = {};
    if (currentUser.role === UserRole.OFFICER) {
      // Officer: Only own (via responses)
      where.responses = { user: { userId: currentUser.userId } };
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
    const inquiry = await this.inquiryRepo.findOne({
      where: {
        inquiryId: id,
        responses: { user: { userId: currentUser.userId } },
      }, // Officer only own
      relations: ['responses'],
    });
    if (!inquiry)
      throw new ForbiddenException('Inquiry not found or access denied');

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

    return inquiry;
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const inquiry = await this.inquiryRepo.findOne({
      where: {
        inquiryId: id,
        responses: { user: { userId: currentUser.userId } },
      },
    });
    if (!inquiry)
      throw new ForbiddenException('Inquiry not found or access denied');
    await this.inquiryRepo.remove(inquiry); // Cascades to responses/attachments
  }

  async getDashboard(currentUser: User): Promise<any> {
    console.log(
      'Dashboard role:',
      currentUser.role,
      'userId:',
      currentUser.userId,
    ); // Debug: Log role/userId (remove later)

    let query = this.inquiryRepo.createQueryBuilder('i');

    // Officer: Subquery EXISTS for ownership (boolean, no dupes)
    if (currentUser.role === UserRole.OFFICER) {
      // Enum-safe (handles DB varchar)
      query = query.where(
        'EXISTS (SELECT 1 FROM response res JOIN "user" u ON res.user_id = u.user_id WHERE res.inquiry_id = i.inquiry_id AND u.user_id = :userId)',
        { userId: currentUser.userId },
      );
      console.log('Applied officer filter for userId:', currentUser.userId); // Debug
    } else if (currentUser.role === UserRole.ADMIN) {
      // Explicit admin branch—no filter
      // Global: No where/subquery
      console.log('Applied admin global—no filter'); // Debug
    } else {
      throw new ForbiddenException('Invalid role for dashboard access'); // Edge: Unknown role
    }

    const stats = await query
      .select('i.status, COUNT(DISTINCT i.inquiry_id) AS count')
      .groupBy('i.status')
      .getRawMany();

    console.log('Raw stats:', stats); // Debug: [{ status: 'pending', count: 4 }, ...]

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
}
