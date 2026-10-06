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
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import type { Rel } from '@mikro-orm/core';
import { User } from '#/users/entities/user.entity.js';

@Entity({ tableName: 'leaderboard_scores' })
export class LeaderboardScore {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => User)
  user!: Rel<User>;

  /** Number of likes received by posts authored by this user during the current month. */
  @Property({ type: 'number', default: 0 })
  likesCount: number = 0;

  /** Year-month key (e.g. "2026-10") so past scores survive a reset. */
  @Property()
  month!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
