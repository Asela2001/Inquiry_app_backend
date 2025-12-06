import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Inquiry } from './inquiry.entity';

export enum RequesterType {
  ARMY = 'army',
  CIVIL = 'civil',
}

@Entity('requester')
export class Requester {
  @PrimaryGeneratedColumn({ name: 'requester_id' })
  requesterId: number;

  @Column({
    name: 'requester_type',
    type: 'enum',
    enum: RequesterType,
    default: RequesterType.ARMY,
  })
  requesterType: RequesterType;

  @Column({ name: 'officer_reg_no', length: 50, nullable: true })
  officerRegNo?: string; // Required for army

  @Column({ name: 'nic', length: 20, unique: true, nullable: true })
  nic?: string; // Required for civil

  @Column({ name: 'r_first_name', length: 50 })
  rFirstName: string;

  @Column({ name: 'r_last_name', length: 50 })
  rLastName: string;

  @Column({ name: 'r_email', length: 100, unique: true, nullable: true })
  rEmail?: string;

  @Column({ name: 'phone_no', length: 20 })
  phoneNo: string; // Key for call verification

  @Column({ name: 'rank', length: 50 })
  rank: string; // e.g., 'Captain' or 'N/A' for civil

  @Column({ name: 'estb', length: 100 })
  estb: string; // Establishment/unit or 'N/A' for civil

  // Relation: One requester has many inquiries
  @OneToMany(() => Inquiry, (inquiry) => inquiry.requester)
  inquiries: Inquiry[];

  // Note: Validate army/civil logic in service (e.g., if army, require officerRegNo && !nic)
}
