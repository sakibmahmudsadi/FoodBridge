import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OrganizationKind {
  DONOR = 'DONOR',
  NGO = 'NGO',
}

export enum OrganizationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 180 })
  name: string;

  @Column({ type: 'enum', enum: OrganizationKind })
  kind: OrganizationKind;

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.PENDING,
  })
  status: OrganizationStatus;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
