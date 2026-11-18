import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Reservation } from '../reservations/entities/reservation.entity.js';
import { NgoVolunteer } from '../ngo-volunteers/entities/ngo-volunteer.entity.js';
import { CollectionAssignment } from '../assignments/entities/collection-assignment.entity.js';
import { DeliveryRecord } from '../delivery-records/entities/delivery-record.entity.js';
import { ReservationStatus } from '../common/reservation-status.enum.js';
import { MembershipStatus } from '../common/membership-status.enum.js';
import { AssignmentStatus } from '../common/assignment-status.enum.js';
import { DeliveryStatus } from '../common/delivery-status.enum.js';

@Injectable()
export class NgoReportsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(NgoVolunteer)
    private readonly ngoVolunteerRepository: Repository<NgoVolunteer>,
    @InjectRepository(CollectionAssignment)
    private readonly assignmentRepository: Repository<CollectionAssignment>,
    @InjectRepository(DeliveryRecord)
    private readonly deliveryRecordRepository: Repository<DeliveryRecord>,
  ) {}

  async getReport(ngoId: string) {
    const reservationsByStatus: Record<string, number> = {};
    for (const status of Object.values(ReservationStatus)) {
      reservationsByStatus[status] = await this.reservationRepository.count({
        where: { ngoId: ngoId, status: status },
      });
    }

    const activeVolunteers = await this.ngoVolunteerRepository.count({
      where: { ngoId: ngoId, status: MembershipStatus.ACTIVE },
    });

    const pendingInvitations = await this.ngoVolunteerRepository.count({
      where: { ngoId: ngoId, status: MembershipStatus.INVITED },
    });

    const liveAssignments = await this.assignmentRepository.count({
      where: {
        reservation: { ngoId: ngoId },
        status: In([AssignmentStatus.OFFERED, AssignmentStatus.ACCEPTED]),
      },
    });

    const deliveriesWaitingForConfirmation =
      await this.deliveryRecordRepository.count({
        where: {
          reservation: { ngoId: ngoId },
          status: DeliveryStatus.REPORTED,
        },
      });

    const disputedDeliveries = await this.deliveryRecordRepository.count({
      where: {
        reservation: { ngoId: ngoId },
        status: DeliveryStatus.DISPUTED,
      },
    });

    const confirmedQuantityByUnit: { unit: string; totalQuantity: string }[] =
      await this.deliveryRecordRepository
        .createQueryBuilder('delivery')
        .innerJoin('delivery.reservation', 'reservation')
        .innerJoin('reservation.donation', 'donation')
        .select('donation.unit', 'unit')
        .addSelect('SUM(delivery.deliveredQuantity)', 'totalQuantity')
        .where('reservation.ngoId = :ngoId', { ngoId: ngoId })
        .andWhere('delivery.status = :status', {
          status: DeliveryStatus.CONFIRMED,
        })
        .groupBy('donation.unit')
        .getRawMany();

    return {
      reservationsByStatus: reservationsByStatus,
      activeVolunteers: activeVolunteers,
      pendingInvitations: pendingInvitations,
      liveAssignments: liveAssignments,
      deliveriesWaitingForConfirmation: deliveriesWaitingForConfirmation,
      disputedDeliveries: disputedDeliveries,
      confirmedQuantityByUnit: confirmedQuantityByUnit,
    };
  }
}
