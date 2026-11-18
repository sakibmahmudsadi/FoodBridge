import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  In,
  type EntityManager,
  type FindOptionsWhere,
  type Repository,
} from 'typeorm';
import { ReservationStatus } from '../common/reservation-status.enum.js';
import { FoodCategory } from '../food-categories/entities/food-category.entity.js';
import { Reservation } from '../reservations/entities/reservation.entity.js';
import { DonationStatus } from './donation-status.enum.js';
import { DonationUnit } from './donation-unit.enum.js';
import type { CreateDonationDto } from './dtos/create-donation.dto.js';
import type { DonationQueryDto } from './dtos/donation-query.dto.js';
import type { UpdateDonationDto } from './dtos/update-donation.dto.js';
import { Donation } from './entities/donation.entity.js';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
  ) {}

  async createDraft(userId: string, dto: CreateDonationDto): Promise<Donation> {
    return this.donationRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Donation);
      const draft = repository.create({
        donorUserId: userId,
        categoryId: dto.categoryId,
        title: dto.title,
        quantity: dto.quantity,
        unit: dto.unit,
        pickupAddress: dto.pickupAddress,
        area: dto.area,
        availableFrom: new Date(dto.availableFrom),
        pickupDeadline: new Date(dto.pickupDeadline),
        declaredUseByAt: new Date(dto.declaredUseByAt),
        status: DonationStatus.DRAFT,
      });

      this.validateTerms(draft);
      await this.checkActiveCategory(manager, draft.categoryId);
      return repository.save(draft);
    });
  }

  async getDonations(userId: string, query: DonationQueryDto) {
    const { page, limit, categoryId, status } = query;
    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) {
      throw new BadRequestException('Page is too large.');
    }

    const where: FindOptionsWhere<Donation> = { donorUserId: userId };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.donationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'ASC' },
      skip,
      take: limit,
    });
    return { data, page, limit, total };
  }

  async getDonation(userId: string, id: string): Promise<Donation> {
    return this.getOwnDonation(this.donationRepository.manager, userId, id);
  }

  async updateDonation(
    userId: string,
    id: string,
    dto: UpdateDonationDto,
  ): Promise<Donation> {
    return this.donationRepository.manager.transaction(async (manager) => {
      const donation = await this.getOwnDonation(manager, userId, id);
      this.checkEditableStatus(donation);
      await this.checkNoActiveReservation(manager, id);

      const repository = manager.getRepository(Donation);
      repository.merge(donation, {
        categoryId: dto.categoryId,
        title: dto.title,
        quantity: dto.quantity,
        unit: dto.unit,
        pickupAddress: dto.pickupAddress,
        area: dto.area,
        availableFrom: dto.availableFrom
          ? new Date(dto.availableFrom)
          : donation.availableFrom,
        pickupDeadline: dto.pickupDeadline
          ? new Date(dto.pickupDeadline)
          : donation.pickupDeadline,
        declaredUseByAt: dto.declaredUseByAt
          ? new Date(dto.declaredUseByAt)
          : donation.declaredUseByAt,
      });
      this.validateTerms(donation);
      if (dto.categoryId !== undefined) {
        await this.checkActiveCategory(manager, donation.categoryId);
      }

      return repository.save(donation);
    });
  }

  async publishDonation(userId: string, id: string): Promise<Donation> {
    return this.donationRepository.manager.transaction(async (manager) => {
      const donation = await this.getOwnDonation(manager, userId, id);
      if (donation.status !== DonationStatus.DRAFT) {
        throw new ConflictException('Only a draft can be published.');
      }

      await this.checkNoActiveReservation(manager, id);
      this.validateTerms(donation);
      await this.checkActiveCategory(manager, donation.categoryId);
      donation.status = DonationStatus.AVAILABLE;
      return manager.save(donation);
    });
  }

  async withdrawDonation(userId: string, id: string): Promise<Donation> {
    return this.donationRepository.manager.transaction(async (manager) => {
      const donation = await this.getOwnDonation(manager, userId, id);
      if (donation.status !== DonationStatus.AVAILABLE) {
        throw new ConflictException(
          'Only an available donation can be withdrawn.',
        );
      }

      await this.checkNoActiveReservation(manager, id);
      donation.status = DonationStatus.CANCELLED;
      return manager.save(donation);
    });
  }

  async archiveDonation(userId: string, id: string): Promise<void> {
    await this.donationRepository.manager.transaction(async (manager) => {
      const donation = await this.getOwnDonation(manager, userId, id);
      this.checkEditableStatus(donation);
      if (await manager.existsBy(Reservation, { donationId: id })) {
        throw new ConflictException(
          'Donations with reservation history cannot be archived.',
        );
      }

      await manager.softRemove(donation);
    });
  }

  private async getOwnDonation(
    manager: EntityManager,
    userId: string,
    id: string,
  ): Promise<Donation> {
    const donation = await manager.findOne(Donation, {
      where: { id, donorUserId: userId },
      lock: manager.queryRunner?.isTransactionActive
        ? { mode: 'pessimistic_write' }
        : undefined,
    });
    if (!donation) {
      throw new NotFoundException('Donation not found.');
    }
    return donation;
  }

  private async checkActiveCategory(
    manager: EntityManager,
    id: string,
  ): Promise<void> {
    const category = await manager.findOne(FoodCategory, {
      where: { id },
      lock: { mode: 'pessimistic_read' },
    });
    if (!category) {
      throw new NotFoundException('Food category not found.');
    }
    if (!category.isActive) {
      throw new ConflictException('Select an active food category.');
    }
  }

  private checkEditableStatus(donation: Donation): void {
    if (
      donation.status !== DonationStatus.DRAFT &&
      donation.status !== DonationStatus.AVAILABLE
    ) {
      throw new ConflictException(
        'Only draft or available donations can be edited or archived.',
      );
    }
  }

  private async checkNoActiveReservation(
    manager: EntityManager,
    donationId: string,
  ): Promise<void> {
    const active = await manager.existsBy(Reservation, {
      donationId,
      status: In([
        ReservationStatus.RESERVED,
        ReservationStatus.ASSIGNED,
        ReservationStatus.PICKED_UP,
      ]),
    });
    if (active) {
      throw new ConflictException('This donation has an active reservation.');
    }
  }

  private validateTerms(donation: Donation): void {
    const quantity = Number(donation.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    const requiresWholeUnits =
      donation.unit === DonationUnit.BOXES ||
      donation.unit === DonationUnit.MEALS;
    if (requiresWholeUnits && !Number.isInteger(quantity)) {
      throw new BadRequestException('Boxes and meals require a whole number.');
    }

    const { availableFrom, pickupDeadline, declaredUseByAt } = donation;
    if (
      !(availableFrom < pickupDeadline && pickupDeadline <= declaredUseByAt) ||
      pickupDeadline.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'The future pickup deadline must follow availability and be at or before the use-by time.',
      );
    }
  }
}
