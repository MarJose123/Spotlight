/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '#/users/dto/user-response.dto.js';

/** User with their resolved monthly budget. */
export class UserBudgetDto {
  @ApiProperty({ description: 'User profile.' })
  user!: UserResponseDto;

  @ApiProperty({
    description: 'Per-user override. Null means global default.',
    nullable: true,
  })
  customBudget: number | null = null;

  @ApiProperty({ description: 'Resolved budget: custom or global default.' })
  resolvedBudget!: number;
}
