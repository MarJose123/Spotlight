/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeaderboardService } from '#/leaderboard/leaderboard.service.js';

@Injectable()
export class LeaderboardCron {
  private readonly logger = new Logger(LeaderboardCron.name);

  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async recalculateLeaderboard() {
    this.logger.log('Scheduled leaderboard recalculation');
    await this.leaderboardService.recalculateScores();
  }
}
