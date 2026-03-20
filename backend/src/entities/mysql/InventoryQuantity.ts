import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductMaster } from './ProductMaster';
import { User } from './User';
import { CustomerOrder } from './CustomerOrder';

@Entity('inventory_quantity')
export class InventoryQuantity {
  @PrimaryColumn({ name: 'product_master_id', type: 'bigint' })
  productMasterId!: number;

  @Column({ name: 'available_quantity', type: 'int' })
  availableQuantity!: number;

  @Column({ name: 'reserved_quantity', type: 'int' })
  reservedQuantity!: number;

  @Column({ name: 'safety_stock', type: 'int' })
  safetyStock!: number;

  @Column({ name: 'updated_by_user', type: 'varchar', length: 15, nullable: true })
  updatedByUser: string | null = null;

  @Column({ name: 'updated_by_order', type: 'bigint', nullable: true })
  updatedByOrder: number | null = null;

  @Column({ name: 'last_update', type: 'datetime', precision: 6 })
  lastUpdate!: Date;

  // Many-to-One relationships

  @ManyToOne(() => ProductMaster, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_master_id' })
  productMaster!: ProductMaster;

  @ManyToOne(() => User, { onUpdate: 'CASCADE', onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by_user' })
  updatedByUserEntity?: User;

  @ManyToOne(() => CustomerOrder, { onUpdate: 'CASCADE', onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by_order' })
  updatedByOrderEntity?: CustomerOrder;
}