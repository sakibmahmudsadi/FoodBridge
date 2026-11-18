import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DonorProfileModule } from './donor-profile/donor-profile.module.js';
import { NgoProfileModule } from './ngo-profile/ngo-profile.module.js';
import { VolunteerProfileModule } from './volunteer-profile/volunteer-profile.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodCategoriesModule } from './food-categories/food-categories.module.js';
import { DonationsModule } from './donations/donations.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { NgoVolunteersModule } from './ngo-volunteers/ngo-volunteers.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { AssignmentsModule } from './assignments/assignments.module.js';
import { DeliveryRecordsModule } from './delivery-records/delivery-records.module.js';
import { NgoReportsModule } from './ngo-reports/ngo-reports.module.js';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DonorProfileModule,
    NgoProfileModule,
    VolunteerProfileModule,
    FoodCategoriesModule,
    DonationsModule,
    OrganizationsModule,
    NgoVolunteersModule,
    ReservationsModule,
    AssignmentsModule,
    DeliveryRecordsModule,
    NgoReportsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME ?? 'foodbridge_donor_dev',
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNC === 'true',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
