import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DeliveryRecord } from './entities/delivery-record.entity.js';
import { Reservation } from '../reservations/entities/reservation.entity.js';
import { Donation } from '../donations/entities/donation.entity.js';
import { CollectionAssignment } from '../assignments/entities/collection-assignment.entity.js';
import { DeliveryStatus } from '../common/delivery-status.enum.js';
import { ReservationStatus } from '../common/reservation-status.enum.js';
import { AssignmentStatus } from '../common/assignment-status.enum.js';
import { DonationStatus } from '../donations/donation-status.enum.js';
import { getDatabaseTime } from '../common/database-helpers.js';
import { DisputeDeliveryDto } from './dto/dispute-delivery.dto.js';
import { ReportDeliveryDto } from './dto/report-delivery.dto.js';

@Injectable()
export class DeliveryRecordsService {
  constructor(
    @InjectRepository(DeliveryRecord)
    private readonly deliveryRecordRepository: Repository<DeliveryRecord>,
    private readonly dataSource: DataSource,
  ) {}

  // A volunteer reports the amount delivered after recording pickup.
  async report(volunteerId: string, assignmentId: string, dto: ReportDeliveryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    let deliveryId = '';

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const assignment = await queryRunner.manager.findOne(CollectionAssignment, {
        where: { id: assignmentId },
        relations: { membership: true, reservation: true },
      });
      if (!assignment) throw new NotFoundException('Assignment not found');
      if (assignment.membership.volunteerId !== volunteerId) {
        throw new ForbiddenException('This assignment is not yours');
      }

      const donation = await queryRunner.manager.findOne(Donation, {
        where: { id: assignment.reservation.donationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!donation) throw new NotFoundException('Donation not found');

      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: assignment.reservationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');

      const lockedAssignment = await queryRunner.manager.findOne(CollectionAssignment, {
        where: { id: assignmentId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedAssignment) throw new NotFoundException('Assignment not found');
      if (lockedAssignment.membershipId !== assignment.membershipId) {
        throw new ForbiddenException('This assignment is not yours');
      }
      if (
        lockedAssignment.status !== AssignmentStatus.ACCEPTED ||
        reservation.status !== ReservationStatus.PICKED_UP
      ) {
        throw new ConflictException(
          'Pickup must be recorded before reporting delivery',
        );
      }

      const deliveredQuantity = Number(dto.deliveredQuantity);
      if (
        deliveredQuantity <= 0 ||
        deliveredQuantity > Number(donation.quantity)
      ) {
        throw new ConflictException(
          'Delivered quantity must be greater than zero and no more than the donated quantity',
        );
      }

      const duplicate = await queryRunner.manager.findOne(DeliveryRecord, {
        where: { assignmentId },
        lock: { mode: 'pessimistic_write' },
      });
      if (duplicate) {
        throw new ConflictException(
          'A delivery has already been reported for this assignment',
        );
      }

      const now = await getDatabaseTime(queryRunner);
      const record = queryRunner.manager.create(DeliveryRecord, {
        reservationId: reservation.id,
        assignmentId,
        reportedById: volunteerId,
        deliveredQuantity: dto.deliveredQuantity,
        recipientName: dto.recipientName,
        reportedAt: now,
        status: DeliveryStatus.REPORTED,
      });
      await queryRunner.manager.save(record);
      deliveryId = record.id;
      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }

    return this.toResponse(await this.getDelivery(deliveryId));
  }

  async confirm(ngoId: string, id: string) {
    const delivery = await this.getDelivery(id);
    if (delivery.reservation.ngoId !== ngoId) {
      throw new ForbiddenException('This delivery is not for your NGO');
    }

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const donation = await queryRunner.manager.findOne(Donation, {
        where: { id: delivery.reservation.donationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!donation) {
        throw new NotFoundException('Donation not found');
      }

      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: delivery.reservationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      await queryRunner.manager.findOne(CollectionAssignment, {
        where: { id: delivery.assignmentId },
        lock: { mode: 'pessimistic_write' },
      });

      const lockedDelivery = await queryRunner.manager.findOne(DeliveryRecord, {
        where: { id: id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedDelivery) {
        throw new NotFoundException('Delivery record not found');
      }
      if (lockedDelivery.status !== DeliveryStatus.REPORTED) {
        throw new ConflictException(
          'Only a reported delivery can be confirmed',
        );
      }
      if (reservation.status !== ReservationStatus.PICKED_UP) {
        throw new ConflictException('This food has not been picked up yet');
      }
      if (lockedDelivery.reportedAt > donation.declaredUseByAt) {
        throw new ConflictException(
          'This delivery was reported after the use-by time and needs admin review',
        );
      }

      const now = await getDatabaseTime(queryRunner);

      await queryRunner.manager.update(DeliveryRecord, id, {
        status: DeliveryStatus.CONFIRMED,
        confirmedById: ngoId,
        confirmedAt: now,
      });

      await queryRunner.manager.update(Reservation, reservation.id, {
        status: ReservationStatus.DELIVERED,
        deliveredAt: now,
      });

      await queryRunner.manager.update(Donation, donation.id, {
        status: DonationStatus.DELIVERED,
      });

      await queryRunner.manager.update(
        CollectionAssignment,
        delivery.assignmentId,
        {
          status: AssignmentStatus.COMPLETED,
          endedAt: now,
        },
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }

    const confirmedDelivery = await this.getDelivery(id);
    return this.toResponse(confirmedDelivery);
  }

  async dispute(ngoId: string, id: string, dto: DisputeDeliveryDto) {
    const delivery = await this.getDelivery(id);
    if (delivery.reservation.ngoId !== ngoId) {
      throw new ForbiddenException('This delivery is not for your NGO');
    }

    const result = await this.deliveryRecordRepository.update(
      { id: id, status: DeliveryStatus.REPORTED },
      { status: DeliveryStatus.DISPUTED, disputeReason: dto.reason },
    );
    if (result.affected === 0) {
      throw new ConflictException('Only a reported delivery can be disputed');
    }

    const disputedDelivery = await this.getDelivery(id);
    return this.toResponse(disputedDelivery);
  }

  private async getDelivery(id: string) {
    const delivery = await this.deliveryRecordRepository.findOne({
      where: { id: id },
      relations: { reservation: { donation: true } },
    });
    if (!delivery) {
      throw new NotFoundException('Delivery record not found');
    }
    return delivery;
  }

  private toResponse(delivery: DeliveryRecord) {
    return {
      id: delivery.id,
      status: delivery.status,
      reservationId: delivery.reservationId,
      reservationStatus: delivery.reservation?.status,
      donationTitle: delivery.reservation?.donation?.title,
      unit: delivery.reservation?.donation?.unit,
      deliveredQuantity: delivery.deliveredQuantity,
      recipientName: delivery.recipientName,
      reportedById: delivery.reportedById,
      reportedAt: delivery.reportedAt,
      confirmedById: delivery.confirmedById,
      confirmedAt: delivery.confirmedAt,
      disputeReason: delivery.disputeReason,
    };
  }
}
