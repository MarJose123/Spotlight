/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Entity, Index, ManyToOne, PrimaryKey, Property, } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import type { Rel } from '@mikro-orm/core';
import { Posts } from '@/posts/entities/posts.entity';
import { User } from '@/users/entities/user.entity';

@Entity({ tableName: 'likes' })
export class Likes {
  @PrimaryKey({ type: 'uuid' })
  @Index()
  id: string = randomUUID();

  @ManyToOne(() => Posts)
  post!: Rel<Posts>;

  @ManyToOne(() => User)
  user!: Rel<User>;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
