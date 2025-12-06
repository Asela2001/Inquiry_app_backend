import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn, // Add this import for FK mapping
  OneToMany,
} from 'typeorm';
import { Inquiry } from './inquiry.entity';
import { User } from './user.entity';
import { Attachment } from './attachment.entity';

@Entity('response')
export class Response {
  @PrimaryGeneratedColumn({ name: 'response_id' })
  responseId: number;

  @Column({ name: 'response_text', type: 'text' })
  responseText: string;

  @CreateDateColumn({
    name: 'r_created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  rCreatedAt: Date;

  // Relations: @JoinColumn maps to DB FK column (auto-populates from relation)
  @ManyToOne(() => Inquiry, (inquiry) => inquiry.responses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inquiry_id' }) // Links to your DB column; sets inquiry_id = inquiry.inquiryId
  inquiry: Inquiry;

  @ManyToOne(() => User, (user) => user.responses, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' }) // Links to your DB column; sets user_id = user.userId
  user: User;

  @OneToMany(() => Attachment, (attachment) => attachment.response)
  attachments: Attachment[];
}
