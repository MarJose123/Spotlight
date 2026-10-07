/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { EntityRepository } from '@mikro-orm/core';
import dayjs from 'dayjs';
import { LeaderboardScore } from '#/leaderboard/entities/leaderboard-score.entity.js';
import { LeaderboardEntryDto } from '#/leaderboard/dto/leaderboard-entry.dto.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { User } from '#/users/entities/user.entity.js';
import { UserMapper } from '#/users/mappers/user.mapper.js';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(LeaderboardScore)
    private readonly scoreRepository: EntityRepository<LeaderboardScore>,
    @InjectRepository(Posts)
    private readonly postsRepository: EntityRepository<Posts>,
    private readonly em: EntityManager,
    private readonly userMapper: UserMapper,
  ) {}

  private currentMonth(): string {
    return dayjs().format('YYYY-MM');
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
    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();

    // Find all posts created this month — no need to populate user;
    // the FK (user.id) is available on the unpopulated reference.
    const posts = await this.postsRepository.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

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
   * Read the current month's leaderboard. Recalculates scores from the likes
   * table on each call.
   */
  async getLeaderboard(): Promise<LeaderboardEntryDto[]> {
    await this.recalculateScores();

    const month = this.currentMonth();

    const scores = await this.scoreRepository.find(
      { month },
      {
        populate: ['user'],
        orderBy: { likesCount: 'desc' },
        limit: 10,
      },
    );

    const mapped = scores.map((score, index) => ({
      rank: index + 1,
      user: this.userMapper.toResponse(score.user),
      likesCount: score.likesCount,
    }));
    const result = mapped.filter(
      (entry): entry is LeaderboardEntryDto => entry.user !== null,
    );

    return result;
  }
}
