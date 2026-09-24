/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import type { Dictionary, EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { PostsFactory } from '@/database/factories/PostsFactory';
import { faker } from '@faker-js/faker';
import { User } from '@/users/entities/user.entity';

export class PostsSeeder extends Seeder {
 async run(em: EntityManager, context: Dictionary<User[]>): Promise<void> {
    new PostsFactory(em).make(10, {
      user: faker.helpers.arrayElement(context.user),
    });
    await em.flush();
  }
}
