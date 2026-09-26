/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '@/users/enums/status.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'Account status of the user.',
    enum: UserStatus,
    enumName: 'UserStatus',
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status: UserStatus | undefined;
}
