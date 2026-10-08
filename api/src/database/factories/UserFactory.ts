/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Factory } from '@mikro-orm/seeder';
import { User } from '#/users/entities/user.entity.js';
import { fakerEN as faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

export class UserFactory extends Factory<User> {
  model = User;

  definition(): Partial<User> {
    const name = faker.person.fullName();
    return {
      avatar: faker.image.avatar(),
      username: name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30),
      name,
      email: faker.internet.email().toLowerCase(),
      password: bcrypt.hashSync('admin123', 12),
    };
  }
}
