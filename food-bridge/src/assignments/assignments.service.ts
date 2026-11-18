import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { CollectionAssignment } from './entities/collection-assignment.entity.js';
import { Reservation } from '../reservations/entities/reservation.entity.js';
import { Donation } from '../donations/entities/donation.entity.js';
import { NgoVolunteer } from '../ngo-volunteers/entities/ngo-volunteer.entity.js';
import { VolunteerProfile } from '../volunteer-profile/entities/volunteer-profile.entity.js';
import { AvailabilityStatus } from '../common/availability-status.enum.js';
import { AssignmentStatus } from '../common/assignment-status.enum.js';
import { ReservationStatus } from '../common/reservation-status.enum.js';
import { MembershipStatus } from '../common/membership-status.enum.js';
import { UserRole } from '../common/user-role.enum.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import {
  getDatabaseTime,
  isUniqueViolation,
} from '../common/database-helpers.js';
import { NgoVolunteersService } from '../ngo-volunteers/ngo-volunteers.service.js';
import { OfferAssignmentDto } from './dto/offer-assignment.dto.js';
import { QueryAssignmentsDto } from './dto/query-assignments.dto.js';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(CollectionAssignment)
    private readonly assignmentRepository: Repository<CollectionAssignment>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly ngoVolunteersService: NgoVolunteersService,
    private readonly dataSource: DataSource,
  ) {}

  async offer(ngoId: string, reservationId: string, dto: OfferAssignmentDto) {
    await this.ngoVolunteersService.checkNgoIsVerified(ngoId);

    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (reservation.ngoId !== ngoId) {
      throw new ForbiddenException('This reservation is not from your NGO');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    let assignmentId = '';

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const donation = await queryRunner.manager.findOne(Donation, {
        where: { id: reservation.donationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!donation) {
        throw new NotFoundException('Donation not found');
      }

      const lockedReservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: reservationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedReservation) {
        throw new NotFoundException('Reservation not found');
      }
      if (lockedReservation.status !== ReservationStatus.RESERVED) {
        throw new ConflictException(
          'A task can only be offered while the reservation is waiting for a volunteer',
        );
      }

      const now = await getDatabaseTime(queryRunner);
      if (now >= donation.pickupDeadline) {
        throw new ConflictException('The pickup deadline has already passed');
      }

      const membership = await queryRunner.manager.findOne(NgoVolunteer, {
        where: { id: dto.membershipId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!membership) {
        throw new NotFoundException('Membership not found');
      }
      if (membership.ngoId !== ngoId) {
        throw new ForbiddenException(
          'This volunteer is not a member of your NGO',
        );
      }
      if (membership.status !== MembershipStatus.ACTIVE) {
        throw new ConflictException(
          'This volunteer is not an active member of your NGO',
        );
      }
      const volunteerProfile = await queryRunner.manager.findOne(
        VolunteerProfile,
        { where: { userId: membership.volunteerId } },
      );
      if (
        !volunteerProfile ||
        volunteerProfile.availability !== AvailabilityStatus.AVAILABLE
      ) {
        throw new ConflictException('This volunteer is currently unavailable');
      }

      const liveAssignment = await queryRunner.manager.findOne(
        CollectionAssignment,
        {
          where: {
            reservationId: reservationId,
            status: In([AssignmentStatus.OFFERED, AssignmentStatus.ACCEPTED]),
          },
        },
      );
      if (liveAssignment) {
        throw new ConflictException(
          'This reservation already has a live assignment',
        );
      }

      const assignment = queryRunner.manager.create(CollectionAssignment, {
        reservationId: reservationId,
        membershipId: membership.id,
        status: AssignmentStatus.OFFERED,
        assignedAt: now,
        notes: dto.notes ?? null,
      });
      await queryRunner.manager.save(assignment);
      assignmentId = assignment.id;

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'This reservation already has a live assignment',
        );
      }
      throw error;
    } finally {
      await queryRunner.release();
    }

    const savedAssignment = await this.getAssignment(assignmentId);
    return this.toResponse(savedAssignment);
  }

  async findAll(user: AuthUser, query: QueryAssignmentsDto) {
    const where: FindOptionsWhere<CollectionAssignment> = {};

    if (user.userRole === UserRole.NGO) {
      where.reservation = { ngoId: user.userId };
    }
    if (user.userRole === UserRole.VOLUNTEER) {
      where.membership = { volunteerId: user.userId };
    }
    if (query.status) {
      where.status = query.status;
    }

    const [assignments, total] = await this.assignmentRepository.findAndCount({
      where: where,
      relations: {
        reservation: { donation: true },
        membership: { volunteer: { user: true } },
      },
      order: { assignedAt: 'DESC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const data = assignments.map((assignment) => this.toResponse(assignment));

    return {
      data: data,
      meta: {
        total: total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(user: AuthUser, id: string) {
    const assignment = await this.getAssignment(id);
    this.checkUserCanAccess(user, assignment);
    return this.toResponse(assignment);
  }

  // A volunteer accepts an offer; the reservation is now assigned to them.
  async accept(volunteerId: string, id: string) {
    const existing = await this.getAssignment(id);
    if (existing.membership.volunteerId !== volunteerId) {
      throw new ForbiddenException('This assignment is not yours');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const donation = await queryRunner.manager.findOne(Donation, {
        where: { id: existing.reservation.donationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!donation) throw new NotFoundException('Donation not found');

      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: existing.reservationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');

      const assignment = await queryRunner.manager.findOne(CollectionAssignment, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!assignment) throw new NotFoundException('Assignment not found');
      if (assignment.membershipId !== existing.membershipId) {
        throw new ForbiddenException('This assignment is not yours');
      }
      if (
        assignment.status !== AssignmentStatus.OFFERED ||
        reservation.status !== ReservationStatus.RESERVED
      ) {
        throw new ConflictException('Only an open offer can be accepted');
      }

      const now = await getDatabaseTime(queryRunner);
      if (now >= donation.pickupDeadline) {
        throw new ConflictException('The pickup deadline has already passed');
      }

      await queryRunner.manager.update(CollectionAssignment, id, {
        status: AssignmentStatus.ACCEPTED,
        acceptedAt: now,
      });
      await queryRunner.manager.update(Reservation, reservation.id, {
        status: ReservationStatus.ASSIGNED,
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return this.toResponse(await this.getAssignment(id));
  }

  // A volunteer declines an offer so the NGO can offer it to another volunteer.
  async decline(volunteerId: string, id: string) {
    const existing = await this.getAssignment(id);
    if (existing.membership.volunteerId !== volunteerId) {
      throw new ForbiddenException('This assignment is not yours');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: existing.reservationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');

      const assignment = await queryRunner.manager.findOne(CollectionAssignment, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!assignment) throw new NotFoundException('Assignment not found');
      if (assignment.membershipId !== existing.membershipId) {
        throw new ForbiddenException('This assignment is not yours');
      }
      if (
        assignment.status !== AssignmentStatus.OFFERED ||
        reservation.status !== ReservationStatus.RESERVED
      ) {
        throw new ConflictException('Only an open offer can be declined');
      }

      const now = await getDatabaseTime(queryRunner);
      await queryRunner.manager.update(CollectionAssignment, id, {
        status: AssignmentStatus.DECLINED,
        endedAt: now,
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return this.toResponse(await this.getAssignment(id));
  }

  // A volunteer records pickup before submitting the delivery report.
  async recordPickup(volunteerId: string, id: string) {
    const existing = await this.getAssignment(id);
    if (existing.membership.volunteerId !== volunteerId) {
      throw new ForbiddenException('This assignment is not yours');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const donation = await queryRunner.manager.findOne(Donation, {
        where: { id: existing.reservation.donationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!donation) throw new NotFoundException('Donation not found');

      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: existing.reservationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');

      const assignment = await queryRunner.manager.findOne(CollectionAssignment, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!assignment) throw new NotFoundException('Assignment not found');
      if (assignment.membershipId !== existing.membershipId) {
        throw new ForbiddenException('This assignment is not yours');
      }
      if (
        assignment.status !== AssignmentStatus.ACCEPTED ||
        reservation.status !== ReservationStatus.ASSIGNED
      ) {
        throw new ConflictException('Only an accepted assignment can be picked up');
      }

      const now = await getDatabaseTime(queryRunner);
      if (now >= donation.pickupDeadline) {
        throw new ConflictException('The pickup deadline has passed');
      }

      // ReservationStatus records the pickup step; no extra reservation columns are needed.
      await queryRunner.manager.update(Reservation, reservation.id, {
        status: ReservationStatus.PICKED_UP,
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return this.toResponse(await this.getAssignment(id));
  }

  async cancel(ngoId: string, id: string) {
    const assignment = await this.getAssignment(id);
    if (assignment.reservation.ngoId !== ngoId) {
      throw new ForbiddenException('This assignment is not from your NGO');
    }

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await queryRunner.manager.findOne(Donation, {
        where: { id: assignment.reservation.donationId },
        lock: { mode: 'pessimistic_write' },
      });

      const lockedReservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: assignment.reservationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedReservation) {
        throw new NotFoundException('Reservation not found');
      }

      const lockedAssignment = await queryRunner.manager.findOne(
        CollectionAssignment,
        {
          where: { id: id },
          lock: { mode: 'pessimistic_write' },
        },
      );
      if (!lockedAssignment) {
        throw new NotFoundException('Assignment not found');
      }
      if (
        lockedAssignment.status !== AssignmentStatus.OFFERED &&
        lockedAssignment.status !== AssignmentStatus.ACCEPTED
      ) {
        throw new ConflictException('This assignment is already closed');
      }
      if (
        lockedReservation.status !== ReservationStatus.RESERVED &&
        lockedReservation.status !== ReservationStatus.ASSIGNED
      ) {
        throw new ConflictException(
          'An assignment cannot be cancelled after pickup',
        );
      }

      const now = await getDatabaseTime(queryRunner);

      await queryRunner.manager.update(CollectionAssignment, id, {
        status: AssignmentStatus.CANCELLED,
        endedAt: now,
      });

      await queryRunner.manager.update(Reservation, lockedReservation.id, {
        status: ReservationStatus.RESERVED,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }

    const cancelledAssignment = await this.getAssignment(id);
    return this.toResponse(cancelledAssignment);
  }

  private async getAssignment(id: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: id },
      relations: {
        reservation: { donation: true },
        membership: { volunteer: { user: true } },
      },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }

  private checkUserCanAccess(user: AuthUser, assignment: CollectionAssignment) {
    if (
      user.userRole === UserRole.NGO &&
      assignment.reservation.ngoId !== user.userId
    ) {
      throw new ForbiddenException('This assignment is not from your NGO');
    }
    if (
      user.userRole === UserRole.VOLUNTEER &&
      assignment.membership.volunteerId !== user.userId
    ) {
      throw new ForbiddenException('This assignment is not yours');
    }
  }

  private toResponse(assignment: CollectionAssignment) {
    return {
      id: assignment.id,
      status: assignment.status,
      reservationId: assignment.reservationId,
      reservationStatus: assignment.reservation?.status,
      donationTitle: assignment.reservation?.donation?.title,
      quantity: assignment.reservation?.donation?.quantity,
      unit: assignment.reservation?.donation?.unit,
      pickupAddress: assignment.reservation?.donation?.pickupAddress,
      pickupDeadline: assignment.reservation?.donation?.pickupDeadline,
      membershipId: assignment.membershipId,
      volunteerId: assignment.membership?.volunteerId,
      volunteerName: assignment.membership?.volunteer?.user?.name,
      volunteerPhone: assignment.membership?.volunteer?.user?.phone,
      assignedAt: assignment.assignedAt,
      acceptedAt: assignment.acceptedAt,
      endedAt: assignment.endedAt,
      notes: assignment.notes,
    };
  }
}
