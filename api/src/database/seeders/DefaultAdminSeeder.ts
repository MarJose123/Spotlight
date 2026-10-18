/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import dayjs from 'dayjs';
import { User } from '#/users/entities/user.entity.js';
import { UserRole } from '#/users/enums/role.enum.js';
import { UserStatus } from '#/users/enums/status.enum.js';
import { UserMonthlyPoints } from '#/leaderboard/entities/user-monthly-points.entity.js';
import bcrypt from 'bcrypt';

export class DefaultAdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const existing = await em.findOne(User, {
      email: 'admin@spotlight.local',
    });
    if (existing) return;

    const user = em.create(User, {
      avatar: undefined,
      username: 'spotlight-admin',
      name: 'Default Admin',
      email: 'admin@spotlight.local',
      password: bcrypt.hashSync('adminspotlight', 12),
      type: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Initialize monthly points for the admin user
    const month = dayjs().format('YYYY-MM');
    em.create(UserMonthlyPoints, {
      user,
      month,
      totalPoints: 100,
      pointsSpent: 0,
      pointsEarned: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
