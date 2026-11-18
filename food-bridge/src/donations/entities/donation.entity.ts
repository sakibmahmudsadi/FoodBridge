import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FoodCategory } from '../../food-categories/entities/food-category.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Organization } from '../../organizations/entities/organization.entity.js';
import { DonationStatus } from '../donation-status.enum.js';
import { DonationUnit } from '../donation-unit.enum.js';

@Entity('donations')
@Index('idx_donations_organization_created', [
  'donorOrganizationId',
  'createdAt',
])
@Check('ck_donations_quantity_positive', 'quantity > 0')
@Check(
  'ck_donations_collection_dates',
  'available_from < pickup_deadline AND pickup_deadline <= declared_use_by_at',
)
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'donor_user_id', type: 'uuid' })
  donorUserId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'donor_user_id' })
  donor: User;

  // Admin approval assigns an organization to drafts from the earlier branch.
  @Column({ name: 'donor_organization_id', type: 'uuid', nullable: true })
  donorOrganizationId: string | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'donor_organization_id' })
  donorOrganization?: Organization | null;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => FoodCategory, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: FoodCategory;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantity: string;

  @Column({ type: 'enum', enum: DonationUnit })
  unit: DonationUnit;

  @Column({ name: 'pickup_address', type: 'text' })
  pickupAddress: string;

  @Column({ type: 'varchar', length: 100 })
  area: string;

  @Column({ name: 'available_from', type: 'timestamptz' })
  availableFrom: Date;

  @Column({ name: 'pickup_deadline', type: 'timestamptz' })
  pickupDeadline: Date;

  @Column({ name: 'declared_use_by_at', type: 'timestamptz' })
  declaredUseByAt: Date;

  @Column({ type: 'varchar', length: 24, default: DonationStatus.DRAFT })
  status: DonationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
