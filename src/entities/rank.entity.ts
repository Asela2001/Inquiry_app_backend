import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Requester } from './requester.entity';

@Entity('rank')
export class Rank {
  @PrimaryGeneratedColumn()
  rank_id: number;

  @Column({ length: 50, unique: true })
  rank_name: string; // e.g., 'Captain', 'N/A' for civil

  @Column({ type: 'text', nullable: true })
  description?: string; // Optional: e.g., 'Mid-level officer'

  @OneToMany(() => Requester, (requester) => requester.rank)
  requesters: Requester[]; // For queries like: All requesters with this rank
}
