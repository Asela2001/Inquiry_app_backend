import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Response } from './response.entity';

export enum UserRole {
  OFFICER = 'officer',
  ADMIN = 'admin',
}

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'u_first_name', length: 50 })
  uFirstName: string;

  @Column({ name: 'u_last_name', length: 50 })
  uLastName: string;

  @Column({ name: 'department', length: 100 })
  department: string;

  @Column({ name: 'u_email', length: 100, unique: true })
  uEmail: string;

  @Column({ name: 'password', length: 255 })
  password: string; // Always hash this in service (bcrypt)

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    default: UserRole.OFFICER,
  })
  role: UserRole;

  // Relation: One user (officer/admin) has many responses
  @OneToMany(() => Response, (response) => response.user)
  responses: Response[];
}
