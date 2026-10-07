/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { User } from '#/users/entities/user.entity.js';
import { UserRole } from '#/users/enums/role.enum.js';
import { UserStatus } from '#/users/enums/status.enum.js';

export class DefaultAdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    em.create(User, {
      avatar: undefined,
      username: 'spotlight-admin',
      name: 'Default Admin',
      email: 'admin@spotlight.local',
      password: 'adminspotlight',
      type: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
