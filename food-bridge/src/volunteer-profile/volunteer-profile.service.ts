import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
import { VolunteerProfile } from './entities/volunteer-profile.entity.js';
import { VolunteerAvailability } from './entities/volunteer-availability.entity.js';
import { UsersService } from '../users/users.service.js';
import { AvailabilityStatus } from '../common/availability-status.enum.js';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto.js';
import { ReplaceScheduleDto } from './dto/schedule.dto.js';
import { QueryAvailableDto, QueryVolunteersDto } from './dto/query-volunteers.dto.js';
import type { UpdateVolunteerDto as AuthUpdateVolunteerDto } from '../auth/dto/update-volunteer.dto.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

@Injectable()
export class VolunteerProfileService {
    constructor(
        @InjectRepository(VolunteerProfile) private readonly profileRepo: Repository<VolunteerProfile>,
        @InjectRepository(VolunteerAvailability) private readonly scheduleRepo: Repository<VolunteerAvailability>,
        private readonly usersService: UsersService,
        private readonly dataSource: DataSource,
    ){}

    /** Used by AuthService during registration (inside its transaction). */
    async createProfile(manager:EntityManager,userId:string,address:string):Promise<VolunteerProfile>{
        const volunteerRepository= manager.getRepository(VolunteerProfile);
        const profile=volunteerRepository.create({
            userId,address
        });

        return volunteerRepository.save(profile);
    }

    async updateProfile(manager:EntityManager,userId:string,dto:AuthUpdateVolunteerDto):Promise<VolunteerProfile>{
        const repository = manager.getRepository(VolunteerProfile);
        const profile = await repository.findOne({where:{userId}});
        if (!profile) throw new NotFoundException('Volunteer profile not found');
        if (dto.address !== undefined) profile.address = dto.address;
        if (dto.availability !== undefined) profile.availability = dto.availability;
        return repository.save(profile);
    }

    // ---------- helpers ----------

    /** Flatten profile + user and never expose the password hash. */
    private toResponse(p: VolunteerProfile) {
        return {
            id: p.userId,
            name: p.user?.name,
            email: p.user?.email,
            phone: p.user?.phone,
            address: p.address,
            availability: p.availability,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }

    private async getEntity(userId: string): Promise<VolunteerProfile> {
        const profile = await this.profileRepo.findOne({
            where: { userId },
            relations: { user: true },
        });
        if (!profile) throw new NotFoundException('Volunteer not found');
        return profile;
    }

    // ---------- CRUD ----------

    async findMe(userId: string) {
        return this.toResponse(await this.getEntity(userId));
    }

    async findOne(id: string) {
        return this.toResponse(await this.getEntity(id));
    }

    async findAll(query: QueryVolunteersDto) {
        const [items, total] = await this.profileRepo.findAndCount({
            where: query.availability ? { availability: query.availability } : {},
            relations: { user: true },
            order: { createdAt: 'DESC' },
            skip: (query.page - 1) * query.limit,
            take: query.limit,
        });

        return {
            data: items.map((p) => this.toResponse(p)),
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }

    async update(userId: string, dto: UpdateVolunteerDto) {
        await this.getEntity(userId); // 404 if missing

        try {
            await this.dataSource.transaction(async (manager) => {
                await this.usersService.updateUser(manager, userId, {
                    name: dto.name,
                    phone: dto.phone,
                });
                if (dto.address !== undefined) {
                    await manager.getRepository(VolunteerProfile).update({ userId }, { address: dto.address });
                }
            });
        } catch (err) {
            if (err instanceof QueryFailedError && (err.driverError as { code?: string })?.code === '23505') {
                throw new ConflictException('Phone number is already in use');
            }
            throw err;
        }

        return this.findMe(userId);
    }

    /** Soft delete the profile and the login account together. */
    async remove(userId: string) {
        await this.getEntity(userId);

        await this.dataSource.transaction(async (manager) => {
            await manager.getRepository(VolunteerProfile).softDelete({ userId });
            await this.usersService.softDeleteUser(userId, manager);
        });

        return { message: 'Volunteer deleted' };
    }

    // ---------- availability status ----------

    async setAvailability(userId: string, availability: AvailabilityStatus) {
        await this.getEntity(userId);
        await this.profileRepo.update({ userId }, { availability });
        return { id: userId, availability };
    }

    // ---------- weekly schedule ----------

    async getSchedule(userId: string) {
        await this.getEntity(userId);
        return this.scheduleRepo.find({
            where: { volunteerId: userId },
            order: { dayOfWeek: 'ASC', startTime: 'ASC' },
            select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
        });
    }

    async replaceSchedule(userId: string, dto: ReplaceScheduleDto) {
        await this.getEntity(userId);
        this.validateSlots(dto.slots);

        await this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(VolunteerAvailability);
            await repo.delete({ volunteerId: userId });
            if (dto.slots.length > 0) {
                await repo.save(
                    dto.slots.map((s) =>
                        repo.create({
                            volunteerId: userId,
                            dayOfWeek: s.dayOfWeek,
                            startTime: s.startTime,
                            endTime: s.endTime,
                        }),
                    ),
                );
            }
        });

        return this.getSchedule(userId);
    }

    private validateSlots(slots: ReplaceScheduleDto['slots']) {
        for (const s of slots) {
            if (s.startTime >= s.endTime) {
                throw new BadRequestException(
                    `startTime must be before endTime (day ${s.dayOfWeek}: ${s.startTime}-${s.endTime})`,
                );
            }
        }

        const sorted = [...slots].sort(
            (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
        );
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const cur = sorted[i];
            if (prev.dayOfWeek === cur.dayOfWeek && cur.startTime < prev.endTime) {
                throw new BadRequestException(`Overlapping slots on day ${cur.dayOfWeek}`);
            }
        }
    }

    /** Volunteers marked AVAILABLE whose schedule covers the given day (and time, if given). */
    async findAvailable(query: QueryAvailableDto) {
        if (query.time !== undefined && !TIME_REGEX.test(query.time)) {
            throw new BadRequestException('time must be HH:mm (24h)');
        }

        const qb = this.profileRepo
            .createQueryBuilder('p')
            .innerJoinAndSelect('p.user', 'u')
            .innerJoin('p.schedule', 's')
            .where('p.availability = :status', { status: AvailabilityStatus.AVAILABLE })
            .andWhere('s.day_of_week = :day', { day: query.day });

        if (query.time) {
            qb.andWhere('s.start_time <= :time AND s.end_time > :time', { time: query.time });
        }

        const items = await qb.distinct(true).getMany();
        return items.map((p) => this.toResponse(p));
    }
}
