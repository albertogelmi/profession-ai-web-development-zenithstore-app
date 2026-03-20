import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('jwt_blacklist')
export class JwtBlacklist {
  @PrimaryColumn({ name: 'token_jti', type: 'varchar', length: 255 })
  tokenJti!: string;

  @Column({ name: 'user_reference', type: 'varchar', length: 50, nullable: true })
  userReference?: string; // Can be user ID, customer ID, or any identifier

  @Column({ name: 'user_type', type: 'varchar', length: 20, nullable: true })
  userType?: string; // 'user', 'customer', or other types

  @Column({ name: 'invalidated_at', type: 'datetime', precision: 6 })
  invalidatedAt!: Date;

  @Column({ name: 'expires_at', type: 'datetime', precision: 6 })
  expiresAt!: Date;

  @Column({ name: 'reason', type: 'varchar', length: 255, nullable: true })
  reason?: string; // Optional reason for blacklisting
}