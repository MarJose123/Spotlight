/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { LeaderboardService } from '#/leaderboard/leaderboard.service.js';
import { Auth } from '#/auth/guard/auth.guard.js';
import {
  ApiGetLeaderboard,
  ApiLeaderboardController,
} from '#/leaderboard/decorators/leaderboard-api.decorator.js';
import { UserMapper } from '#/users/mappers/user.mapper.js';
import { LeaderboardEntryDto } from '#/leaderboard/dto/leaderboard-entry.dto.js';

@ApiLeaderboardController()
@Controller('leaderboard')
@UseGuards(Auth)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiGetLeaderboard()
  async getLeaderboard(): Promise<LeaderboardEntryDto[]> {
    const entries = await this.leaderboardService.getLeaderboard();
    return entries.map((entry) => ({
      rank: entry.rank,
      user: UserMapper.toResponse(entry.user)!,
      likesCount: entry.likesCount,
    }));
  }
}
