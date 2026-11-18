import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Donation } from '../../donations/entities/donation.entity.js';
import { NgoProfile } from '../../ngo-profile/entities/ngo-profile.entity.js';
import { ReservationStatus } from '../../common/reservation-status.enum.js';

@Entity('reservations')
@Index('uq_one_live_reservation_per_donation', ['donationId'], {
  unique: true,
  where: `status IN ('RESERVED', 'ASSIGNED', 'PICKED_UP')`,
})
@Index(['ngoId', 'status'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'donation_id' })
  donationId: string;

  @ManyToOne(() => Donation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'donation_id' })
  donation: Donation;

  @Column('uuid', { name: 'ngo_id' })
  ngoId: string;

  @ManyToOne(() => NgoProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ngo_id' })
  ngo: NgoProfile;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.RESERVED,
  })
  status: ReservationStatus;

  @Column({ name: 'reserved_at', type: 'timestamptz' })
  reservedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;
}
