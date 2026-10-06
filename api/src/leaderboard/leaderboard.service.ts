/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { EntityRepository } from '@mikro-orm/core';
import { LeaderboardScore } from '#/leaderboard/entities/leaderboard-score.entity.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { User } from '#/users/entities/user.entity.js';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(LeaderboardScore)
    private readonly scoreRepository: EntityRepository<LeaderboardScore>,
    @InjectRepository(Posts)
    private readonly postsRepository: EntityRepository<Posts>,
    private readonly em: EntityManager,
  ) {}

  private currentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Recalculate all leaderboard scores for the current month from the likes
   * table. Each like on a post counts toward the post's author.
   */
  async recalculateScores(): Promise<void> {
    const month = this.currentMonth();
    this.logger.log(`Recalculating leaderboard scores for ${month}`);

    // Clear current month scores
    await this.scoreRepository.nativeDelete({ month });

    // Aggregate likes per post author for the current month
    // A like counts if the post was created in the current month
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    // Find all posts created this month with their like counts
    const posts = await this.postsRepository.find(
      {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      },
      {
        populate: ['user'],
      },
    );

    // Aggregate likes count per user using the denormalized likesCount field
    const userLikesMap = new Map<string, number>();
    for (const post of posts) {
      const userId = post.user.id;
      const prev = userLikesMap.get(userId) ?? 0;
      userLikesMap.set(userId, prev + post.likesCount);
    }

    // Insert scores
    for (const [userId, count] of userLikesMap) {
      if (count > 0) {
        const score = new LeaderboardScore();
        score.user = this.em.getReference(User, userId);
        score.likesCount = count;
        score.month = month;
        this.scoreRepository.create(score);
      }
    }
    await this.em.flush();

    this.logger.warn(
      `Leaderboard recalculated: ${userLikesMap.size} users for ${month}`,
    );
  }

  /**
   * Get the current month's leaderboard ranked by likes descending.
   */
  async getLeaderboard(): Promise<
    Array<{ rank: number; user: any; likesCount: number }>
  > {
    const month = this.currentMonth();

    const scores = await this.scoreRepository.find(
      { month },
      {
        orderBy: { likesCount: 'desc' },
        populate: ['user'],
        limit: 10,
      },
    );

    return scores.map((score, index) => ({
      rank: index + 1,
      user: score.user,
      likesCount: score.likesCount,
    }));
  }

  /**
   * Reset all current month scores. Called by the cron job on the 1st of each
   * month at 1:00 AM.
   */
  async resetCurrentMonth(): Promise<void> {
    const month = this.currentMonth();
    this.logger.log(`Resetting leaderboard for ${month}`);
    const deleted = await this.scoreRepository.nativeDelete({ month });
    this.logger.warn(`Removed ${deleted} leaderboard entries for ${month}`);
  }

  /**
   * Cron: reset leaderboard every 1st day of the month at 1:00 AM.
   */
  @Cron('0 1 1 * *')
  async resetMonthlyLeaderboard(): Promise<void> {
    await this.resetCurrentMonth();
  }
}
