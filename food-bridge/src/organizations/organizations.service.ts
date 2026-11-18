import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { UserRole } from '../common/user-role.enum.js';
import { Donation } from '../donations/entities/donation.entity.js';
import { DonorProfile } from '../donor-profile/entities/donor-profile.entity.js';
import { User } from '../users/entities/user.entity.js';
import {
  Organization,
  OrganizationKind,
  OrganizationStatus,
} from './entities/organization.entity.js';

@Injectable()
export class OrganizationsService {
  constructor(private readonly dataSource: DataSource) {}

  async approveDonor(userId: string, organizationId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { userId, role: UserRole.DONOR },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user || !(await manager.existsBy(DonorProfile, { userId }))) {
        throw new NotFoundException('Active donor profile not found.');
      }

      if (
        organizationId &&
        user.organizationId &&
        organizationId !== user.organizationId
      ) {
        throw new ConflictException(
          'This donor already belongs to an organization.',
        );
      }

      const existingId = organizationId ?? user.organizationId;
      const organization = existingId
        ? await manager.findOne(Organization, {
            where: { id: existingId, kind: OrganizationKind.DONOR },
            lock: { mode: 'pessimistic_write' },
          })
        : manager.create(Organization, {
            name: user.name.slice(0, 180),
            kind: OrganizationKind.DONOR,
          });

      if (!organization) {
        throw new NotFoundException('Donor organization not found.');
      }

      organization.status = OrganizationStatus.APPROVED;
      await manager.save(organization);
      await manager.update(
        User,
        { userId },
        { organizationId: organization.id },
      );

      // Earlier drafts belonged to the individual donor. Keep them in the catalogue.
      await manager.update(
        Donation,
        { donorUserId: userId, donorOrganizationId: IsNull() },
        { donorOrganizationId: organization.id },
      );

      return { userId, organization };
    });
  }
}
