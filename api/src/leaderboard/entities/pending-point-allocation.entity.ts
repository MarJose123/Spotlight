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
import { Posts } from '#/posts/entities/posts.entity.js';

/**
 * Temporary allocation record awaiting the edit window to expire.
 * Processed into PointAllocation after the configured delay.
 */
@Entity({ tableName: 'pending_point_allocations' })
@Unique({ properties: ['post', 'toUser'] })
export class PendingPointAllocation {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => User)
  fromUser!: Rel<User>;

  @ManyToOne(() => User)
  toUser!: Rel<User>;

  @ManyToOne(() => Posts)
  post!: Rel<Posts>;

  @Property({ type: 'number' })
  points!: number;

  /** Year-month key (e.g. "2026-10") for fast aggregation. */
  @Property()
  month!: string;

  @Property()
  createdAt: Date = new Date();
}
