import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 15 })
  id!: string;

  @CreateDateColumn({ name: 'start_date', type: 'datetime', precision: 6 })
  startDate!: Date;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean;

  @Column({ name: 'is_blocked', type: 'tinyint', width: 1, default: 0 })
  isBlocked!: boolean;

  @Column({ name: 'end_date', type: 'datetime', precision: 6, nullable: true })
  endDate?: Date;
}