import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('user_credential')
export class UserCredential {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'user_id', type: 'varchar', length: 15 })
  userId!: string;

  @CreateDateColumn({ name: 'start_date', type: 'datetime', precision: 6 })
  startDate!: Date;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean;

  @Column({ name: 'end_date', type: 'datetime', precision: 6 })
  endDate!: Date;

  // Many-to-One relationship with User
  @ManyToOne(() => User, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}