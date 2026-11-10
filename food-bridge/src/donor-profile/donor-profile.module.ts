import { Module } from '@nestjs/common';
import { DonorProfileService } from './donor-profile.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorProfile } from './entities/donor-profile.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([DonorProfile])],
  providers: [DonorProfileService],
  exports:[DonorProfileService]
})
export class DonorProfileModule {}
