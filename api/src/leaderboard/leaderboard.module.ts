/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { LeaderboardController } from '#/leaderboard/leaderboard.controller.js';
import { LeaderboardService } from '#/leaderboard/leaderboard.service.js';
import { AuthModule } from '#/auth/auth.module.js';
import { LeaderboardScore } from '#/leaderboard/entities/leaderboard-score.entity.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { User } from '#/users/entities/user.entity.js';

@Module({
  imports: [
    AuthModule,
    MikroOrmModule.forFeature([LeaderboardScore, Posts, User]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
