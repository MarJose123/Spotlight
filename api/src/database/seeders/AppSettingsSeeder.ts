/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { AppSettings } from '#/leaderboard/entities/app-settings.entity.js';

/** Seeds default application settings; skips keys that already exist. */
export class AppSettingsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const defaults: Array<{ key: string; value: string; description: string }> =
      [
        {
          key: 'leaderboard.monthlyPoints',
          value: '100',
          description: 'Default monthly points budget per user',
        },
        {
          key: 'posts.editWindowMinutes',
          value: '15',
          description: 'Minutes after which posts can no longer be edited',
        },
        {
          key: 'posts.deleteWindowMinutes',
          value: '15',
          description: 'Minutes after which posts can no longer be deleted',
        },
        {
          key: 'comments.editWindowMinutes',
          value: '15',
          description: 'Minutes after which comments can no longer be edited',
        },
        {
          key: 'comments.deleteWindowMinutes',
          value: '15',
          description: 'Minutes after which comments can no longer be deleted',
        },
      ];

    for (const setting of defaults) {
      const existing = await em.findOne(AppSettings, { key: setting.key });
      if (!existing) {
        em.create(AppSettings, { ...setting, updatedAt: new Date() });
      }
    }
  }
}
