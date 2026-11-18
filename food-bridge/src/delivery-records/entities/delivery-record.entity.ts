import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity.js';
import { CollectionAssignment } from '../../assignments/entities/collection-assignment.entity.js';
import { VolunteerProfile } from '../../volunteer-profile/entities/volunteer-profile.entity.js';
import { NgoProfile } from '../../ngo-profile/entities/ngo-profile.entity.js';
import { DeliveryStatus } from '../../common/delivery-status.enum.js';

@Entity('delivery_records')
export class DeliveryRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'reservation_id', unique: true })
  reservationId: string;

  @OneToOne(() => Reservation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column('uuid', { name: 'assignment_id', unique: true })
  assignmentId: string;

  @OneToOne(() => CollectionAssignment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assignment_id' })
  assignment: CollectionAssignment;

  @Column('uuid', { name: 'reported_by' })
  reportedById: string;

  @ManyToOne(() => VolunteerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reported_by' })
  reportedBy: VolunteerProfile;

  @Column({
    name: 'delivered_quantity',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  deliveredQuantity: string;

  @Column({ name: 'recipient_name' })
  recipientName: string;

  @Column({ name: 'reported_at', type: 'timestamptz' })
  reportedAt: Date;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.REPORTED,
  })
  status: DeliveryStatus;

  @Column('uuid', { name: 'confirmed_by', nullable: true })
  confirmedById: string | null;

  @ManyToOne(() => NgoProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'confirmed_by' })
  confirmedBy: NgoProfile;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'dispute_reason', type: 'text', nullable: true })
  disputeReason: string | null;
}
