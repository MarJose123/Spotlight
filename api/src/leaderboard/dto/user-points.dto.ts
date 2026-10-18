/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';

/** Current user's points summary for the active month. */
export class UserPointsDto {
  @ApiProperty({ description: 'Year-month key, e.g. "2026-10".' })
  month!: string;

  @ApiProperty({
    description: 'Resolved monthly budget (custom or global default).',
  })
  totalPoints!: number;

  @ApiProperty({ description: 'Points allocated to others (processed only).' })
  pointsSpent!: number;

  @ApiProperty({ description: 'Points allocated but not yet processed.' })
  pointsPending!: number;

  @ApiProperty({ description: 'Points remaining: total - spent - pending.' })
  pointsRemaining!: number;

  @ApiProperty({ description: 'Points received from others (processed only).' })
  pointsEarned!: number;
}
