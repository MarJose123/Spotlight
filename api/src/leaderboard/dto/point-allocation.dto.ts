/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

/** Point allocation for a single mentioned user in a post. */
export class PointAllocationDto {
  @ApiProperty({ description: 'UUID of the user receiving points.' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: 'Points to award (1–100).' })
  @IsInt()
  @Min(1)
  @Max(100)
  points!: number;
}
