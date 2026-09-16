import { CreateUserDto } from '@/users/dto/create-user.dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '@/users/enums/status.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(UserStatus)
  status: UserStatus | undefined;
}
