import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NgoProfile } from './entities/ngo-profile.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([NgoProfile])],
})
export class NgoProfileModule {}
