import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Inquiry } from './inquiry.entity';
import { Response } from './response.entity';

@Entity('attachment')
export class Attachment {
  @PrimaryGeneratedColumn({ name: 'attachment_id' })
  attachmentId: number;

  @Column({ name: 'file_path', length: 500 })
  filePath: string; // e.g., '/uploads/inquiry-123_proof.pdf' – store via multer in NestJS

  // Relations (one attachment per inquiry OR response; use nullable FKs)

  @ManyToOne(() => Inquiry, (inquiry) => inquiry.attachments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'inquiry_id' }) // Nullable OK
  inquiry?: Inquiry;

  @ManyToOne(() => Response, (response) => response.attachments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'response_id' })
  response?: Response;

  // @ManyToOne(() => Inquiry, {
  //   onDelete: 'CASCADE',
  //   nullable: true,
  // })
  // inquiry?: Inquiry;

  @Column({ name: 'inquiry_id', nullable: true })
  inquiryId?: number;

  // @ManyToOne(() => Response, (response) => response.attachments, {
  //   onDelete: 'CASCADE',
  //   nullable: true,
  // })
  // response?: Response;

  @Column({ name: 'response_id', nullable: true })
  responseId?: number;
}
