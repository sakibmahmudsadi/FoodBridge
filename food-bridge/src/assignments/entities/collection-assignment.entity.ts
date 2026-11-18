import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity.js';
import { NgoVolunteer } from '../../ngo-volunteers/entities/ngo-volunteer.entity.js';
import { AssignmentStatus } from '../../common/assignment-status.enum.js';

@Entity('collection_assignments')
@Index('uq_one_live_assignment_per_reservation', ['reservationId'], {
  unique: true,
  where: `status IN ('OFFERED', 'ACCEPTED')`,
})
@Index(['membershipId', 'status'])
export class CollectionAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'reservation_id' })
  reservationId: string;

  @ManyToOne(() => Reservation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column('uuid', { name: 'membership_id' })
  membershipId: string;

  @ManyToOne(() => NgoVolunteer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'membership_id' })
  membership: NgoVolunteer;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.OFFERED,
  })
  status: AssignmentStatus;

  @Column({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
