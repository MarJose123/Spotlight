/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '#/users/dto/user-response.dto.js';

/** A single ranked entry on the leaderboard. */
export class LeaderboardEntryDto {
  @ApiProperty({ description: 'Rank position (1-based).' })
  rank: number;

  @ApiProperty({ description: 'User profile.' })
  user: UserResponseDto;

  @ApiProperty({ description: 'Total likes on posts created this month.' })
  likesCount: number;
}
