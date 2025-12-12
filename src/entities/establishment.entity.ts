import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Requester } from './requester.entity';

@Entity('establishment')
export class Establishment {
  @PrimaryGeneratedColumn()
  estb_id: number;

  @Column({ length: 100, unique: true })
  estb_name: string; // e.g., 'Colombo Garrison', 'N/A' for civil

  @Column({ length: 50, default: 'military' })
  estb_type: 'military' | 'civil'; // Enforces CHECK from DB

  @OneToMany(() => Requester, (requester) => requester.establishment)
  requesters: Requester[]; // For queries like: All requesters in this estb
}