import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './Customer';

export enum OrderStatus {
  CART = 'CART',
  RESERVED = 'RESERVED',
  EXPIRED = 'EXPIRED',
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

@Entity('customer_order')
export class CustomerOrder {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId!: number;

  @Column({ name: 'start_date', type: 'datetime', precision: 6 })
  startDate!: Date;

  @Column({ name: 'payment_provider', type: 'varchar', length: 50, nullable: true })
  paymentProvider?: string;

  @Column({ name: 'transaction_id', type: 'varchar', length: 100, nullable: true })
  transactionId?: string;

  @Column({ name: 'payment_status', type: 'enum', enum: ['COMPLETED', 'FAILED'], nullable: true })
  paymentStatus?: 'COMPLETED' | 'FAILED';

  @Column({ name: 'payment_date', type: 'datetime', precision: 6, nullable: true })
  paymentDate?: Date;

  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: OrderStatus
  })
  status!: OrderStatus;

  // Shipping destination (may differ from customer)
  @Column({ name: 'shipping_first_name', type: 'varchar', length: 100, nullable: true })
  shippingFirstName: string | null = null;

  @Column({ name: 'shipping_last_name', type: 'varchar', length: 100, nullable: true })
  shippingLastName: string | null = null;

  @Column({ name: 'address_line', type: 'varchar', length: 255, nullable: true })
  addressLine: string | null = null;

  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city: string | null = null;

  @Column({ name: 'postal_code', type: 'varchar', length: 10, nullable: true })
  postalCode: string | null = null;

  @Column({ name: 'province', type: 'varchar', length: 100, nullable: true })
  province: string | null = null;

  @Column({ name: 'user_id', type: 'varchar', length: 15, nullable: true })
  userId?: string;

  @Column({ name: 'last_update', type: 'datetime', precision: 6 })
  lastUpdate!: Date;

  // Many-to-One relationship with Customer
  @ManyToOne(() => Customer, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;
}