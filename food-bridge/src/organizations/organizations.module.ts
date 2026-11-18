import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorCatalogueAuthModule } from '../donor-catalogue-auth/donor-catalogue-auth.module.js';
import { Organization } from './entities/organization.entity.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  imports: [DonorCatalogueAuthModule, TypeOrmModule.forFeature([Organization])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
