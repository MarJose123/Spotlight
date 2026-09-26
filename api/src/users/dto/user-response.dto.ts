/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/users/enums/role.enum';
import { UserStatus } from '@/users/enums/status.enum';

/** A user as returned by the API (never exposes the password hash). */
export class UserResponseDto {
  @ApiProperty({ description: 'User id.', format: 'uuid' })
  id: string;

  @ApiPropertyOptional({
    description: "URL of the user's avatar image.",
    format: 'uri',
    nullable: true,
  })
  avatarUrl?: string;

  @ApiProperty({ description: 'Email address.', format: 'email' })
  email: string;

  @ApiProperty({ description: 'Full name of the user.', example: 'Jane Doe' })
  name: string;

  @ApiPropertyOptional({
    description: 'Unique handle for the user.',
    nullable: true,
  })
  username: string | undefined;

  @ApiProperty({
    description: 'Name shown across the UI (currently the full name).',
    example: 'Jane Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'Account status.',
    enum: UserStatus,
    enumName: 'UserStatus',
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Authorization role.',
    enum: UserRole,
    enumName: 'UserRole',
  })
  role: UserRole;

  @ApiProperty({ description: 'Creation timestamp.', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp.', format: 'date-time' })
  updatedAt: Date;
}
