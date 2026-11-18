import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { NgoVolunteer } from './entities/ngo-volunteer.entity.js';
import { CollectionAssignment } from '../assignments/entities/collection-assignment.entity.js';
import { AssignmentStatus } from '../common/assignment-status.enum.js';
import { NgoProfile } from '../ngo-profile/entities/ngo-profile.entity.js';
import { VolunteerProfile } from '../volunteer-profile/entities/volunteer-profile.entity.js';
import { MembershipStatus } from '../common/membership-status.enum.js';
import { UserRole } from '../common/user-role.enum.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { InviteVolunteerDto } from './dto/invite-volunteer.dto.js';
import { QueryNgoVolunteersDto } from './dto/query-ngo-volunteers.dto.js';

@Injectable()
export class NgoVolunteersService {
  constructor(
    @InjectRepository(NgoVolunteer)
    private readonly ngoVolunteerRepository: Repository<NgoVolunteer>,
    @InjectRepository(NgoProfile)
    private readonly ngoProfileRepository: Repository<NgoProfile>,
    @InjectRepository(VolunteerProfile)
    private readonly volunteerProfileRepository: Repository<VolunteerProfile>,
    private readonly dataSource: DataSource,
  ) {}

  async invite(ngoId: string, dto: InviteVolunteerDto) {
    await this.checkNgoIsVerified(ngoId);

    const volunteer = await this.volunteerProfileRepository.findOne({
      where: { userId: dto.volunteerId },
    });
    if (!volunteer) {
      throw new NotFoundException('Volunteer not found');
    }

    let membership = await this.ngoVolunteerRepository.findOne({
      where: { ngoId: ngoId, volunteerId: dto.volunteerId },
    });

    if (membership && membership.status === MembershipStatus.INVITED) {
      throw new ConflictException('This volunteer is already invited');
    }
    if (membership && membership.status === MembershipStatus.ACTIVE) {
      throw new ConflictException('This volunteer is already in your NGO');
    }

    if (!membership) {
      membership = this.ngoVolunteerRepository.create({
        ngoId: ngoId,
        volunteerId: dto.volunteerId,
      });
    }

    membership.status = MembershipStatus.INVITED;
    membership.invitedAt = new Date();
    membership.acceptedAt = null;
    membership.removedAt = null;
    await this.ngoVolunteerRepository.save(membership);

    const savedMembership = await this.getMembership(membership.id);
    return this.toResponse(savedMembership);
  }

  async findAll(user: AuthUser, query: QueryNgoVolunteersDto) {
    const where: {
      ngoId?: string;
      volunteerId?: string;
      status?: MembershipStatus;
    } = {};

    if (user.userRole === UserRole.NGO) {
      where.ngoId = user.userId;
    }
    if (user.userRole === UserRole.VOLUNTEER) {
      where.volunteerId = user.userId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [memberships, total] = await this.ngoVolunteerRepository.findAndCount(
      {
        where: where,
        relations: { ngo: { user: true }, volunteer: { user: true } },
        order: { invitedAt: 'DESC', id: 'ASC' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      },
    );

    const data = memberships.map((membership) => this.toResponse(membership));

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
    const membership = await this.getMembership(id);
    this.checkUserCanAccess(user, membership);
    return this.toResponse(membership);
  }

  async accept(volunteerId: string, id: string) {
    const membership = await this.getMembership(id);

    if (membership.volunteerId !== volunteerId) {
      throw new ForbiddenException('This invitation is not for you');
    }
    if (membership.status !== MembershipStatus.INVITED) {
      throw new ConflictException('Only an open invitation can be accepted');
    }

    membership.status = MembershipStatus.ACTIVE;
    membership.acceptedAt = new Date();
    await this.ngoVolunteerRepository.save(membership);

    return this.toResponse(membership);
  }

  async decline(volunteerId: string, id: string) {
    const membership = await this.getMembership(id);

    if (membership.volunteerId !== volunteerId) {
      throw new ForbiddenException('This invitation is not for you');
    }
    if (membership.status !== MembershipStatus.INVITED) {
      throw new ConflictException('Only an open invitation can be declined');
    }

    membership.status = MembershipStatus.DECLINED;
    await this.ngoVolunteerRepository.save(membership);

    return this.toResponse(membership);
  }

  async remove(user: AuthUser, id: string) {
    const membership = await this.getMembership(id);
    this.checkUserCanAccess(user, membership);

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const lockedMembership = await queryRunner.manager.findOne(NgoVolunteer, {
        where: { id: id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedMembership) {
        throw new NotFoundException('Membership not found');
      }
      if (
        lockedMembership.status !== MembershipStatus.INVITED &&
        lockedMembership.status !== MembershipStatus.ACTIVE
      ) {
        throw new ConflictException('This membership is already closed');
      }

      const liveAssignment = await queryRunner.manager.findOne(
        CollectionAssignment,
        {
          where: {
            membershipId: id,
            status: In([AssignmentStatus.OFFERED, AssignmentStatus.ACCEPTED]),
          },
        },
      );
      if (liveAssignment) {
        throw new ConflictException(
          'This volunteer has a live collection task and cannot be removed now',
        );
      }

      await queryRunner.manager.update(NgoVolunteer, id, {
        status: MembershipStatus.REMOVED,
        removedAt: new Date(),
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

    const removedMembership = await this.getMembership(id);
    return this.toResponse(removedMembership);
  }

  async checkNgoIsVerified(ngoId: string) {
    const ngo = await this.ngoProfileRepository.findOne({
      where: { userId: ngoId },
    });
    if (!ngo) {
      throw new NotFoundException('NGO profile not found');
    }
    if (ngo.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenException('Your NGO is not verified by admin yet');
    }
  }

  private async getMembership(id: string) {
    const membership = await this.ngoVolunteerRepository.findOne({
      where: { id: id },
      relations: { ngo: { user: true }, volunteer: { user: true } },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    return membership;
  }

  private checkUserCanAccess(user: AuthUser, membership: NgoVolunteer) {
    if (user.userRole === UserRole.NGO && membership.ngoId !== user.userId) {
      throw new ForbiddenException('This membership is not from your NGO');
    }
    if (
      user.userRole === UserRole.VOLUNTEER &&
      membership.volunteerId !== user.userId
    ) {
      throw new ForbiddenException('This membership is not yours');
    }
  }

  private toResponse(membership: NgoVolunteer) {
    return {
      id: membership.id,
      status: membership.status,
      ngoId: membership.ngoId,
      ngoName: membership.ngo?.user?.name,
      volunteerId: membership.volunteerId,
      volunteerName: membership.volunteer?.user?.name,
      volunteerEmail: membership.volunteer?.user?.email,
      volunteerPhone: membership.volunteer?.user?.phone,
      invitedAt: membership.invitedAt,
      acceptedAt: membership.acceptedAt,
      removedAt: membership.removedAt,
    };
  }
}
