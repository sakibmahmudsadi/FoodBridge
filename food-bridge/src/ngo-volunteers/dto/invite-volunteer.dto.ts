import { IsUUID } from 'class-validator';

export class InviteVolunteerDto {
  @IsUUID()
  volunteerId: string;
}
