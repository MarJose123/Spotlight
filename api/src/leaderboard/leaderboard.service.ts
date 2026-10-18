/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { EntityRepository } from '@mikro-orm/core';
import dayjs from 'dayjs';
import { LeaderboardScore } from '#/leaderboard/entities/leaderboard-score.entity.js';
import { PointAllocation } from '#/leaderboard/entities/point-allocation.entity.js';
import { PendingPointAllocation } from '#/leaderboard/entities/pending-point-allocation.entity.js';
import { UserMonthlyPoints } from '#/leaderboard/entities/user-monthly-points.entity.js';
import { AppSettings } from '#/leaderboard/entities/app-settings.entity.js';
import { LeaderboardEntryDto } from '#/leaderboard/dto/leaderboard-entry.dto.js';
import { UserPointsDto } from '#/leaderboard/dto/user-points.dto.js';
import { PointAllocationDto } from '#/leaderboard/dto/point-allocation.dto.js';
import { extractMentionIds } from '#/leaderboard/mention-parser.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { User } from '#/users/entities/user.entity.js';
import { UserMapper } from '#/users/mappers/user.mapper.js';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(LeaderboardScore)
    private readonly scoreRepository: EntityRepository<LeaderboardScore>,
    @InjectRepository(PointAllocation)
    private readonly allocationRepository: EntityRepository<PointAllocation>,
    @InjectRepository(PendingPointAllocation)
    private readonly pendingRepository: EntityRepository<PendingPointAllocation>,
    @InjectRepository(UserMonthlyPoints)
    private readonly monthlyPointsRepository: EntityRepository<UserMonthlyPoints>,
    @InjectRepository(AppSettings)
    private readonly settingsRepository: EntityRepository<AppSettings>,
    @InjectRepository(Posts)
    private readonly postsRepository: EntityRepository<Posts>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly userMapper: UserMapper,
  ) {}

  currentMonth(): string {
    return dayjs().format('YYYY-MM');
  }

  /**
   * Read a single setting value from the database.
   * Falls back to the provided default if the key does not exist.
   */
  async getSetting(key: string, fallback: string): Promise<string> {
    const setting = await this.settingsRepository.findOne({ key });
    return setting?.value ?? fallback;
  }

  /** Read a numeric setting, parsing the stored string value. */
  async getSettingNumber(key: string, fallback: number): Promise<number> {
    const raw = await this.getSetting(key, String(fallback));
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Ensure a UserMonthlyPoints row exists for the given user and month.
   * Resolves the budget from customBudget or the global default.
   */
  async ensureMonthlyPoints(
    userId: string,
    month: string,
  ): Promise<UserMonthlyPoints> {
    let row = await this.monthlyPointsRepository.findOne(
      { user: userId, month },
      { populate: ['user'] },
    );
    if (row) return row;

    const globalDefault = await this.getSettingNumber(
      'leaderboard.monthlyPoints',
      100,
    );
    row = new UserMonthlyPoints();
    row.user = this.em.getReference(User, userId);
    row.month = month;
    row.totalPoints = globalDefault;
    row.pointsSpent = 0;
    row.pointsEarned = 0;
    this.monthlyPointsRepository.create(row);
    await this.em.flush();
    return row;
  }

  /**
   * Store pending allocations for a newly created post.
   * Validates that allocations match mentions and budget is sufficient.
   */
  async storePendingAllocations(
    postId: string,
    authorId: string,
    contentJson: string,
    allocations?: PointAllocationDto[],
  ): Promise<void> {
    // Validate: no self-mention in content, regardless of allocations
    const mentionedIds = new Set(extractMentionIds(contentJson));
    if (mentionedIds.has(authorId)) {
      throw new BadRequestException('You cannot mention yourself in a post');
    }

    if (!allocations || allocations.length === 0) return;

    const month = this.currentMonth();

    // Validate: each allocated user must be mentioned
    for (const alloc of allocations) {
      if (!mentionedIds.has(alloc.userId)) {
        throw new BadRequestException(
          `Point allocation for user ${alloc.userId} not found in post mentions`,
        );
      }
    }

    // Validate: recipients exist
    const userIds = allocations.map((a) => a.userId);
    const recipients = await this.userRepository.find({ id: { $in: userIds } });
    const recipientIds = new Set(recipients.map((u: User) => u.id));
    for (const alloc of allocations) {
      if (!recipientIds.has(alloc.userId)) {
        throw new BadRequestException(
          `User ${alloc.userId} not found for point allocation`,
        );
      }
    }

    // Check budget: pointsSpent + pendingPoints + newTotal <= totalPoints
    const authorRow = await this.ensureMonthlyPoints(authorId, month);
    const pendingRows = await this.pendingRepository.find({
      fromUser: authorId,
      month,
    });
    const pendingPoints = pendingRows.reduce((sum, r) => sum + r.points, 0);
    const totalAllocated = allocations.reduce((sum, a) => sum + a.points, 0);
    const effectiveSpent = authorRow.pointsSpent + pendingPoints;

    if (effectiveSpent + totalAllocated > authorRow.totalPoints) {
      throw new BadRequestException(
        `Insufficient points: allocated ${totalAllocated}, but only ${authorRow.totalPoints - effectiveSpent} remaining this month`,
      );
    }

    // Create pending allocation records
    const post = this.em.getReference(Posts, postId);
    for (const alloc of allocations) {
      const pending = new PendingPointAllocation();
      pending.fromUser = this.em.getReference(User, authorId);
      pending.toUser = this.em.getReference(User, alloc.userId);
      pending.post = post;
      pending.points = alloc.points;
      pending.month = month;
      this.pendingRepository.create(pending);
    }
    await this.em.flush();
  }

  /**
   * Replace pending allocations for a post (called on update within edit window).
   */
  async replacePendingAllocations(
    postId: string,
    authorId: string,
    contentJson: string,
    allocations?: PointAllocationDto[],
  ): Promise<void> {
    const month = this.currentMonth();

    // Remove existing pending allocations for this post
    await this.pendingRepository.nativeDelete({ post: postId });

    // Validate: no self-mention in content, regardless of allocations
    const mentionedIds = new Set(extractMentionIds(contentJson));
    if (mentionedIds.has(authorId)) {
      throw new BadRequestException('You cannot mention yourself in a post');
    }

    if (!allocations || allocations.length === 0) return;

    for (const alloc of allocations) {
      if (!mentionedIds.has(alloc.userId)) {
        throw new BadRequestException(
          `Point allocation for user ${alloc.userId} not found in post mentions`,
        );
      }
    }

    const userIds = allocations.map((a) => a.userId);
    const recipients = await this.userRepository.find({ id: { $in: userIds } });
    const recipientIds = new Set(recipients.map((u: User) => u.id));
    for (const alloc of allocations) {
      if (!recipientIds.has(alloc.userId)) {
        throw new BadRequestException(
          `User ${alloc.userId} not found for point allocation`,
        );
      }
    }

    const authorRow = await this.ensureMonthlyPoints(authorId, month);
    // Recalculate pending (excluding this post since we just deleted them)
    const pendingRows = await this.pendingRepository.find({
      fromUser: authorId,
      month,
    });
    const pendingPoints = pendingRows.reduce((sum, r) => sum + r.points, 0);
    const totalAllocated = allocations.reduce((sum, a) => sum + a.points, 0);
    const effectiveSpent = authorRow.pointsSpent + pendingPoints;

    if (effectiveSpent + totalAllocated > authorRow.totalPoints) {
      throw new BadRequestException(
        `Insufficient points: allocated ${totalAllocated}, but only ${authorRow.totalPoints - effectiveSpent} remaining this month`,
      );
    }

    const post = this.em.getReference(Posts, postId);
    for (const alloc of allocations) {
      const pending = new PendingPointAllocation();
      pending.fromUser = this.em.getReference(User, authorId);
      pending.toUser = this.em.getReference(User, alloc.userId);
      pending.post = post;
      pending.points = alloc.points;
      pending.month = month;
      this.pendingRepository.create(pending);
    }
    await this.em.flush();
  }

  /** Remove all pending allocations for a post (called on delete). */
  async cleanupPendingAllocations(postId: string): Promise<void> {
    await this.pendingRepository.nativeDelete({ post: postId });
  }

  /**
   * Return the current user's points summary.
   */
  async getUserPoints(userId: string): Promise<UserPointsDto> {
    const month = this.currentMonth();
    const row = await this.ensureMonthlyPoints(userId, month);

    const pendingRows = await this.pendingRepository.find({
      fromUser: userId,
      month,
    });
    const pointsPending = pendingRows.reduce((sum, r) => sum + r.points, 0);

    return {
      month,
      totalPoints: row.totalPoints,
      pointsSpent: row.pointsSpent,
      pointsPending,
      pointsRemaining: row.totalPoints - row.pointsSpent - pointsPending,
      pointsEarned: row.pointsEarned,
    };
  }

  /**
   * Process pending allocations older than 15 minutes.
   * Moves them to PointAllocation, deducts from author's pointsSpent,
   * and adds to recipients' pointsEarned.
   */
  async processPendingAllocations(): Promise<void> {
    const contextEm = this.em.fork();
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    const pending = await contextEm.find(
      PendingPointAllocation,
      { createdAt: { $lt: cutoff } },
      { populate: ['fromUser', 'toUser'] },
    );

    if (pending.length === 0) return;

    // Group by month for batch updates
    const monthGroups = new Map<string, PendingPointAllocation[]>();
    for (const p of pending) {
      const group = monthGroups.get(p.month) ?? [];
      group.push(p);
      monthGroups.set(p.month, group);
    }

    for (const [month, group] of monthGroups) {
      // Aggregate deductions per author
      const authorDeductions = new Map<string, number>();
      // Aggregate awards per recipient
      const recipientAwards = new Map<string, number>();

      for (const p of group) {
        const fromId = p.fromUser.id;
        const toId = p.toUser.id;
        authorDeductions.set(
          fromId,
          (authorDeductions.get(fromId) ?? 0) + p.points,
        );
        recipientAwards.set(toId, (recipientAwards.get(toId) ?? 0) + p.points);

        // Create permanent allocation record
        const allocation = new PointAllocation();
        allocation.fromUser = p.fromUser;
        allocation.toUser = p.toUser;
        allocation.post = p.post;
        allocation.points = p.points;
        allocation.month = month;
        contextEm.persist(allocation);
      }

      // Update UserMonthlyPoints
      for (const [userId, amount] of authorDeductions) {
        const row = await contextEm.findOne(UserMonthlyPoints, {
          user: userId,
          month,
        });
        if (row) {
          row.pointsSpent += amount;
        }
      }
      for (const [userId, amount] of recipientAwards) {
        const row = await contextEm.findOne(UserMonthlyPoints, {
          user: userId,
          month,
        });
        if (row) {
          row.pointsEarned += amount;
        }
      }

      // Remove processed pending records
      const pendingIds = group.map((p) => p.id);
      await contextEm.nativeDelete(PendingPointAllocation, {
        id: { $in: pendingIds },
      });
    }

    await contextEm.flush();
    this.logger.log(`Processed ${pending.length} pending point allocations`);
  }

  /**
   * Recalculate leaderboard from UserMonthlyPoints.
   * The old LeaderboardScore table is no longer used for ranking.
   */
  async recalculateScores(): Promise<void> {
    // No-op: leaderboard is now derived from UserMonthlyPoints.pointsEarned
    // which is updated in real-time by processPendingAllocations.
  }

  /**
   * Read the current month's leaderboard ranked by points earned.
   */
  async getLeaderboard(): Promise<LeaderboardEntryDto[]> {
    const month = this.currentMonth();

    const rows = await this.monthlyPointsRepository.find(
      { month, pointsEarned: { $gt: 0 } },
      {
        populate: ['user'],
        orderBy: { pointsEarned: 'desc' },
        limit: 10,
      },
    );

    const mapped = rows.map((row, index) => ({
      rank: index + 1,
      user: this.userMapper.toResponse(row.user),
      pointsEarned: row.pointsEarned,
      pointsShare: row.pointsSpent,
    }));
    const result = mapped.filter(
      (entry): entry is LeaderboardEntryDto => entry.user !== null,
    );

    return result;
  }

  /** Return all settings (admin-only). */
  async getSettings(): Promise<
    Array<{ key: string; value: string; description: string }>
  > {
    const settings = await this.settingsRepository.findAll();
    return settings.map((s) => ({
      key: s.key,
      value: s.value,
      description: s.description,
    }));
  }

  /** Update a single setting (admin-only). */
  async updateSetting(key: string, value: string): Promise<void> {
    let setting = await this.settingsRepository.findOne({ key });
    if (!setting) {
      throw new BadRequestException(`Setting "${key}" not found`);
    }
    setting.value = value;
    await this.em.flush();
  }

  /** Return paginated users with their resolved budgets (admin-only). */
  async getUsersWithBudgets(paginationQuery: {
    page: number;
    limit: number;
  }): Promise<{
    data: Array<{
      user: { id: string; name: string; email: string };
      customBudget: number | null;
      resolvedBudget: number;
    }>;
    meta: {
      total: number;
      itemCount: number;
      perPage: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { page, limit } = paginationQuery;
    const skip = (page - 1) * limit;
    const month = this.currentMonth();
    const globalDefault = await this.getSettingNumber(
      'leaderboard.monthlyPoints',
      100,
    );

    const [users, total] = await Promise.all([
      this.userRepository.find({}, { limit, offset: skip }),
      this.userRepository.count(),
    ]);
    const monthlyRows = await this.monthlyPointsRepository.find({ month });
    const monthlyMap = new Map(monthlyRows.map((r) => [r.user.id, r]));

    const data = users.map((user) => {
      const row = monthlyMap.get(user.id);
      const customBudget = row?.customBudget ?? null;
      const resolvedBudget = customBudget ?? globalDefault;
      return {
        user: { id: user.id, name: user.name, email: user.email },
        customBudget,
        resolvedBudget,
      };
    });

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        itemCount: data.length,
        perPage: limit,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /** Set or clear a per-user budget override (admin-only). */
  async setUserBudget(
    userId: string,
    customBudget: number | null,
  ): Promise<void> {
    const month = this.currentMonth();
    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException(`User ${userId} not found`);
    }

    let row = await this.monthlyPointsRepository.findOne({
      user: userId,
      month,
    });
    if (!row) {
      row = await this.ensureMonthlyPoints(userId, month);
    }
    row.customBudget = customBudget;
    // Re-resolve totalPoints
    if (customBudget !== null) {
      row.totalPoints = customBudget;
    } else {
      const globalDefault = await this.getSettingNumber(
        'leaderboard.monthlyPoints',
        100,
      );
      row.totalPoints = globalDefault;
    }
    await this.em.flush();
  }
}
