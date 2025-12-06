import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Inquiry } from './inquiry.entity';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'category_name', length: 100, unique: true })
  categoryName: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  // Relation: One category has many inquiries
  @OneToMany(() => Inquiry, (inquiry) => inquiry.category)
  inquiries: Inquiry[];
}
