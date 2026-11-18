import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Donation } from '../../donations/entities/donation.entity.js';
import { Organization } from '../../organizations/entities/organization.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum ReservationStatus {
  RESERVED = 'RESERVED',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

@Entity('reservations')
@Index('idx_reservations_donation', ['donationId'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'donation_id', type: 'uuid' })
  donationId: string;

  @ManyToOne(() => Donation, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'donation_id' })
  donation: Donation;

  @Column({ name: 'ngo_organization_id', type: 'uuid' })
  ngoOrganizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ngo_organization_id' })
  ngoOrganization: Organization;

  @Column({ name: 'reserved_by', type: 'uuid' })
  reservedById: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reserved_by' })
  reservedBy: User;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.RESERVED,
  })
  status: ReservationStatus;

  @Column({
    name: 'reserved_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  reservedAt: Date;
}
