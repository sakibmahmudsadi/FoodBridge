import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DonorProfileModule } from './donor-profile/donor-profile.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [AuthModule, UsersModule, DonorProfileModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'FoodBridge',
      autoLoadEntities: true,
      synchronize: true,
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
