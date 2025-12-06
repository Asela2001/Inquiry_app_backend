import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Requester } from './requester.entity';
import { Response } from './response.entity';
import { Attachment } from './attachment.entity';

export enum InquiryStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('inquiry')
export class Inquiry {
  @PrimaryGeneratedColumn({ name: 'inquiry_id' })
  inquiryId: number;

  @Column({ name: 'subject', length: 200 })
  subject: string;

  @Column({ name: 'inquiry_text', type: 'text' })
  inquiryText: string;

  @CreateDateColumn({
    name: 'i_created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  iCreatedAt: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: InquiryStatus,
    default: InquiryStatus.PENDING,
  })
  status: InquiryStatus;

  // Relations
  @ManyToOne(() => Category, (category) => category.inquiries, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' }) // Maps to DB
  category: Category;

  @ManyToOne(() => Requester, (requester) => requester.inquiries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requester_id' }) // Maps to DB
  requester: Requester;
  // @ManyToOne(() => Category, (category) => category.inquiries, {
  //   onDelete: 'RESTRICT',
  // })
  // category: Category;

  @Column({ name: 'category_id', nullable: true }) // FK column
  categoryId?: number;

  // @ManyToOne(() => Requester, (requester) => requester.inquiries, {
  //   onDelete: 'CASCADE',
  // })
  // requester: Requester;

  @Column({ name: 'requester_id', nullable: true }) // FK column
  requesterId?: number;

  @OneToMany(() => Response, (response) => response.inquiry)
  responses: Response[];

  @OneToMany(() => Attachment, (attachment) => attachment.inquiry)
  attachments: Attachment[];
}
