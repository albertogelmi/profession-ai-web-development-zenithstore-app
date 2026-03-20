import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('category')
@Index('idx_category_active', ['isActive', 'displayOrder'])
export class Category {
  @PrimaryColumn({ name: 'slug', type: 'varchar', length: 100 })
  slug!: string;

  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'icon', type: 'varchar', length: 50, nullable: true })
  icon?: string;

  @Column({ name: 'display_order', type: 'int', default: 999 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 15, nullable: true })
  createdBy?: string;

  // Many-to-One relationship with User (optional)
  @ManyToOne(() => User, { onUpdate: 'CASCADE', onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;
}
