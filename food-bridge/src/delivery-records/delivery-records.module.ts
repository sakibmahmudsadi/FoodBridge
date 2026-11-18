import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryRecord } from './entities/delivery-record.entity.js';
import { DeliveryRecordsService } from './delivery-records.service.js';
import { DeliveryRecordsController } from './delivery-records.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryRecord])],
  controllers: [DeliveryRecordsController],
  providers: [DeliveryRecordsService],
})
export class DeliveryRecordsModule {}
