import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NgoProfile } from './entities/ngo-profile.entity.js';
import { NgoProfileService } from './ngo-profile.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([NgoProfile])],
  providers: [NgoProfileService],
  exports:[NgoProfileService]
})
export class NgoProfileModule {}
