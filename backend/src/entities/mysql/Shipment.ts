import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CustomerOrder } from './CustomerOrder';

export enum ShipmentStatus {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP', 
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED'
}

@Entity('shipment')
export class Shipment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId!: number;

  @Column({ type: 'varchar', length: 100 })
  carrier!: string;

  @Column({ name: 'tracking_code', type: 'varchar', length: 200, unique: true })
  trackingCode!: string;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.CREATED
  })
  status!: ShipmentStatus;

  @Column({ name: 'shipment_date', type: 'datetime', precision: 6, nullable: true })
  shipmentDate?: Date;

  @Column({ name: 'estimated_delivery', type: 'datetime', precision: 6, nullable: true })
  estimatedDelivery?: Date;

  @Column({ name: 'delivered_at', type: 'datetime', precision: 6, nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 100 })
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'last_update', type: 'datetime', precision: 6 })
  lastUpdate!: Date;

  // Relations
  @ManyToOne(() => CustomerOrder, { lazy: true })
  @JoinColumn({ name: 'order_id' })
  order?: CustomerOrder;
}