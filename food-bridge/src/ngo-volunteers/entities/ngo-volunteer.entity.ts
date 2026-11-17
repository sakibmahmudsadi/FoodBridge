import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NgoProfile } from '../../ngo-profile/entities/ngo-profile.entity.js';
import { VolunteerProfile } from '../../volunteer-profile/entities/volunteer-profile.entity.js';
import { MembershipStatus } from '../../common/membership-status.enum.js';

@Entity('ngo_volunteers')
@Index(['ngoId', 'volunteerId'], { unique: true })
export class NgoVolunteer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'ngo_id' })
  ngoId: string;

  @ManyToOne(() => NgoProfile)
  @JoinColumn({ name: 'ngo_id' })
  ngo: NgoProfile;

  @Column('uuid', { name: 'volunteer_id' })
  volunteerId: string;

  @ManyToOne(() => VolunteerProfile)
  @JoinColumn({ name: 'volunteer_id' })
  volunteer: VolunteerProfile;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.INVITED,
  })
  status: MembershipStatus;

  @Column({ name: 'invited_at', type: 'timestamptz' })
  invitedAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'removed_at', type: 'timestamptz', nullable: true })
  removedAt: Date | null;
}
