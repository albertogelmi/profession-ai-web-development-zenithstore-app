import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Customer } from './Customer';
import { ProductMaster } from './ProductMaster';

@Entity('customer_wishlist')
@Unique('ux_wishlist_customer_product', ['customerId', 'productCode'])
@Index('idx_wishlist_customer', ['customerId'])
@Index('idx_wishlist_product', ['productCode'])
export class CustomerWishlist {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId!: number;

  @Column({ name: 'product_code', type: 'varchar', length: 100 })
  productCode!: string;

  @CreateDateColumn({
    name: 'added_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  addedAt!: Date;

  // Many-to-One relationship with Customer
  @ManyToOne(() => Customer, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  // Many-to-One relationship with ProductMaster (using product_code)
  @ManyToOne(() => ProductMaster, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_code', referencedColumnName: 'productCode' })
  product!: ProductMaster;
}
