import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './Category';
import { ProductMaster } from './ProductMaster';
import { User } from './User';

@Entity('product_version')
export class ProductVersion {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'product_master_id', type: 'bigint' })
  productMasterId!: number;

  @Column({ name: 'category_slug', type: 'varchar', length: 100 })
  categorySlug!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'price', type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Column({ name: 'created_by', type: 'varchar', length: 15 })
  createdBy!: string;

  @Column({ name: 'start_date', type: 'datetime', precision: 6 })
  startDate!: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 15 })
  updatedBy!: string;

  @Column({ name: 'last_update', type: 'datetime', precision: 6 })
  lastUpdate!: Date;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean;

  @Column({ name: 'deleted_by', type: 'varchar', length: 15, nullable: true })
  deletedBy?: string;

  @Column({ name: 'end_date', type: 'datetime', precision: 6, nullable: true })
  endDate?: Date;

  // Generated field for uniqueness constraint
  @Column({ 
    name: 'is_current', 
    type: 'tinyint', 
    width: 1,
    generatedType: 'STORED',
    asExpression: 'CASE WHEN is_active = 1 AND end_date IS NULL THEN 1 ELSE 0 END'
  })
  isCurrent!: boolean;

  // Relazioni Many-to-One

  @ManyToOne(() => ProductMaster, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_master_id' })
  productMaster!: ProductMaster;

  @ManyToOne(() => Category, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_slug' })
  category!: Category;

  @ManyToOne(() => User, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @ManyToOne(() => User, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'updated_by' })
  updater!: User;

  @ManyToOne(() => User, { onUpdate: 'CASCADE', onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleter?: User;
}