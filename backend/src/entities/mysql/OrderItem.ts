import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomerOrder } from './CustomerOrder';
import { ProductMaster } from './ProductMaster';
import { ProductVersion } from './ProductVersion';

@Entity('order_item')
export class OrderItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId!: number;

  @Column({ name: 'product_master_id', type: 'bigint' })
  productMasterId!: number;

  @Column({ name: 'product_version_id', type: 'bigint' })
  productVersionId!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number;

  @Column({ name: 'quantity', type: 'int' })
  quantity!: number;

  // Many-to-One relationships

  @ManyToOne(() => CustomerOrder, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: CustomerOrder;

  @ManyToOne(() => ProductMaster, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_master_id' })
  productMaster!: ProductMaster;

  @ManyToOne(() => ProductVersion, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_version_id' })
  productVersion!: ProductVersion;
}