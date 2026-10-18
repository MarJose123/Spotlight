/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import type { Rel } from '@mikro-orm/core';
import { User } from '#/users/entities/user.entity.js';

/**
 * Tracks per-user monthly points: budget, spent, and earned.
 * `customBudget` overrides the global default when set.
 */
@Entity({ tableName: 'user_monthly_points' })
@Unique({ properties: ['user', 'month'] })
export class UserMonthlyPoints {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => User)
  user!: Rel<User>;

  /** Year-month key (e.g. "2026-10"). */
  @Property()
  month!: string;

  /** Per-user override. Null means use the global default from AppSettings. */
  @Property({ type: 'number', nullable: true })
  customBudget: number | null = null;

  /** Resolved budget: customBudget if set, otherwise the global default. */
  @Property({ type: 'number' })
  totalPoints: number = 0;

  /** Points allocated to others this month (processed only). */
  @Property({ type: 'number', default: 0 })
  pointsSpent: number = 0;

  /** Points received from others this month (processed only). */
  @Property({ type: 'number', default: 0 })
  pointsEarned: number = 0;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
