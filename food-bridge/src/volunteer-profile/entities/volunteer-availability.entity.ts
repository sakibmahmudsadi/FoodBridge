import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { VolunteerProfile } from './volunteer-profile.entity.js';

/** One weekly time window, e.g. Monday 09:00-12:00. */
@Entity('volunteer_availability')
export class VolunteerAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'volunteer_id' })
  volunteerId: string;

  @ManyToOne(() => VolunteerProfile, (v) => v.schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'volunteer_id' })
  volunteer: Relation<VolunteerProfile>;

  /** 0 = Sunday ... 6 = Saturday */
  @Column({ type: 'smallint', name: 'day_of_week' })
  dayOfWeek: number;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @CreateDateColumn()
  createdAt: Date;
}
