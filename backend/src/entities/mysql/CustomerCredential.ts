import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './Customer';

@Entity('customer_credential')
export class CustomerCredential {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId!: number;

  @CreateDateColumn({ name: 'start_date', type: 'datetime', precision: 6 })
  startDate!: Date;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean;

  @Column({ name: 'end_date', type: 'datetime', precision: 6, nullable: true })
  endDate!: Date;

  // Many-to-One relationship with Customer
  @ManyToOne(() => Customer, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;
}