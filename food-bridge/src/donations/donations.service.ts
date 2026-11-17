import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum.js';
import { DonorProfile } from '../donor-profile/entities/donor-profile.entity.js';
import { FoodCategory } from '../food-categories/entities/food-category.entity.js';
import { DonationUnit } from './donation-unit.enum.js';
import type { CreateDonationDto } from './dtos/create-donation.dto.js';
import { Donation } from './entities/donation.entity.js';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
  ) {}

  async createDraft(userId: string, dto: CreateDonationDto): Promise<Donation> {
    return this.donationRepository.manager.transaction(async (manager) => {
      const donor = await manager
        .getRepository(DonorProfile)
        .createQueryBuilder('profile')
        .select('profile.userId')
        .innerJoin('profile.user', 'donor')
        .where('profile.userId = :userId', { userId })
        .andWhere('donor.role = :role', { role: UserRole.DONOR })
        .setLock('pessimistic_read')
        .getOne();

      if (!donor) {
        throw new ForbiddenException('An active donor profile is required.');
      }

      const category = await manager.findOne(FoodCategory, {
        where: { id: dto.categoryId },
        lock: { mode: 'pessimistic_read' },
      });
      if (!category) {
        throw new NotFoundException('Food category not found.');
      }
      if (!category.isActive) {
        throw new ConflictException('Select an active food category.');
      }

      const quantity = Number(dto.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than zero.');
      }

      const requiresWholeUnits =
        dto.unit === DonationUnit.BOXES || dto.unit === DonationUnit.MEALS;
      if (requiresWholeUnits && !Number.isInteger(quantity)) {
        throw new BadRequestException(
          'Boxes and meals require a whole number.',
        );
      }

      const availableFrom = new Date(dto.availableFrom);
      const pickupDeadline = new Date(dto.pickupDeadline);
      const declaredUseByAt = new Date(dto.declaredUseByAt);
      if (
        !(
          availableFrom < pickupDeadline && pickupDeadline <= declaredUseByAt
        ) ||
        pickupDeadline.getTime() <= Date.now()
      ) {
        throw new BadRequestException(
          'The future pickup deadline must follow availability and be at or before the use-by time.',
        );
      }

      const repository = manager.getRepository(Donation);
      const draft = repository.create({
        donorUserId: donor.userId,
        categoryId: category.id,
        title: dto.title,
        quantity: dto.quantity,
        unit: dto.unit,
        pickupAddress: dto.pickupAddress,
        area: dto.area,
        availableFrom,
        pickupDeadline,
        declaredUseByAt,
        status: 'DRAFT',
      });

      return repository.save(draft);
    });
  }
}
