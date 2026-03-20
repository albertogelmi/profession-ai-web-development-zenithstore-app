import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customer')
export class Customer {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @CreateDateColumn({ name: 'start_date', type: 'datetime', precision: 6 })
  startDate!: Date;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean;

  @Column({ name: 'is_blocked', type: 'tinyint', width: 1, default: 0 })
  isBlocked!: boolean;

  @Column({ name: 'end_date', type: 'datetime', precision: 6, nullable: true })
  endDate?: Date;
}