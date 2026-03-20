import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('product_master')
export class ProductMaster {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'product_code', type: 'varchar', length: 100, unique: true })
  productCode!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 15, nullable: true })
  createdBy?: string;

  // Many-to-One relationship with User (optional)
  @ManyToOne(() => User, { onUpdate: 'CASCADE', onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;
}