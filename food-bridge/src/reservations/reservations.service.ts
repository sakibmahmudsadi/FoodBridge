import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity.js';
import { Donation } from '../donations/entities/donation.entity.js';
import { CollectionAssignment } from '../assignments/entities/collection-assignment.entity.js';
import { DonationStatus } from '../donations/donation-status.enum.js';
import { ReservationStatus } from '../common/reservation-status.enum.js';
import { AssignmentStatus } from '../common/assignment-status.enum.js';
import { UserRole } from '../common/user-role.enum.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import {
  getDatabaseTime,
  isUniqueViolation,
} from '../common/database-helpers.js';
import { NgoVolunteersService } from '../ngo-volunteers/ngo-volunteers.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { CancelReservationDto } from './dto/cancel-reservation.dto.js';
import { QueryReservationsDto } from './dto/query-reservations.dto.js';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly ngoVolunteersService: NgoVolunteersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(ngoId: string, dto: CreateReservationDto) {
    await this.ngoVolunteersService.checkNgoIsVerified(ngoId);

    const queryRunner = this.dataSource.createQueryRunner();
    let reservationId = '';

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const donation = await queryRunner.manager.findOne(Donation, {
        where: { id: dto.donationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!donation) {
        throw new NotFoundException('Donation not found');
      }
      if (donation.status !== DonationStatus.AVAILABLE) {
        throw new ConflictException('This donation is no longer available');
      }

      const now = await getDatabaseTime(queryRunner);
      if (now >= donation.pickupDeadline) {
        throw new ConflictException('The pickup deadline has already passed');
      }

      const reservation = queryRunner.manager.create(Reservation, {
        donationId: donation.id,
        ngoId: ngoId,
        status: ReservationStatus.RESERVED,
        reservedAt: now,
      });
      await queryRunner.manager.save(reservation);
      reservationId = reservation.id;

      await queryRunner.manager.update(Donation, donation.id, {
        status: DonationStatus.RESERVED,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (isUniqueViolation(error)) {
        throw new ConflictException('This donation is already reserved');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }

    const savedReservation = await this.getReservation(reservationId);
    return this.toResponse(savedReservation);
  }

  async findAll(user: AuthUser, query: QueryReservationsDto) {
    const where: FindOptionsWhere<Reservation> = {};

    if (user.userRole === UserRole.NGO) {
      where.ngoId = user.userId;
    }
    if (user.userRole === UserRole.DONOR) {
      where.donation = { donorUserId: user.userId };
    }
    if (query.status) {
      where.status = query.status;
    }

    const [reservations, total] = await this.reservationRepository.findAndCount(
      {
        where: where,
        relations: { donation: true, ngo: { user: true } },
        order: { reservedAt: 'DESC', id: 'ASC' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      },
    );

    const data = reservations.map((reservation) =>
      this.toResponse(reservation),
    );

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
    const reservation = await this.getReservation(id);
    this.checkUserCanAccess(user, reservation);
    return this.toResponse(reservation);
  }

  async cancel(ngoId: string, id: string, dto: CancelReservationDto) {
    const reservation = await this.getReservation(id);
    if (reservation.ngoId !== ngoId) {
      throw new ForbiddenException('This reservation is not from your NGO');
    }

    const queryRunner = this.dataSource.createQueryRunner();

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
        where: { id: id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedReservation) {
        throw new NotFoundException('Reservation not found');
      }
      if (
        lockedReservation.status !== ReservationStatus.RESERVED &&
        lockedReservation.status !== ReservationStatus.ASSIGNED
      ) {
        throw new ConflictException(
          'Only a reservation that is not picked up yet can be cancelled',
        );
      }

      const now = await getDatabaseTime(queryRunner);

      await queryRunner.manager.update(
        CollectionAssignment,
        {
          reservationId: id,
          status: In([AssignmentStatus.OFFERED, AssignmentStatus.ACCEPTED]),
        },
        { status: AssignmentStatus.CANCELLED, endedAt: now },
      );

      await queryRunner.manager.update(Reservation, id, {
        status: ReservationStatus.CANCELLED,
        cancelledAt: now,
        cancellationReason: dto.reason,
      });

      let newDonationStatus = DonationStatus.AVAILABLE;
      if (now >= donation.pickupDeadline) {
        newDonationStatus = DonationStatus.EXPIRED;
      }
      await queryRunner.manager.update(Donation, donation.id, {
        status: newDonationStatus,
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

    const cancelledReservation = await this.getReservation(id);
    return this.toResponse(cancelledReservation);
  }

  private async getReservation(id: string) {
    const reservation = await this.reservationRepository.findOne({
      where: { id: id },
      relations: { donation: true, ngo: { user: true } },
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    return reservation;
  }

  private checkUserCanAccess(user: AuthUser, reservation: Reservation) {
    if (user.userRole === UserRole.NGO && reservation.ngoId !== user.userId) {
      throw new ForbiddenException('This reservation is not from your NGO');
    }
    if (
      user.userRole === UserRole.DONOR &&
      reservation.donation.donorUserId !== user.userId
    ) {
      throw new ForbiddenException('This reservation is not for your donation');
    }
  }

  private toResponse(reservation: Reservation) {
    return {
      id: reservation.id,
      status: reservation.status,
      donationId: reservation.donationId,
      donationTitle: reservation.donation?.title,
      quantity: reservation.donation?.quantity,
      unit: reservation.donation?.unit,
      pickupAddress: reservation.donation?.pickupAddress,
      pickupDeadline: reservation.donation?.pickupDeadline,
      ngoId: reservation.ngoId,
      ngoName: reservation.ngo?.user?.name,
      reservedAt: reservation.reservedAt,
      cancelledAt: reservation.cancelledAt,
      cancellationReason: reservation.cancellationReason,
      deliveredAt: reservation.deliveredAt,
    };
  }
}
