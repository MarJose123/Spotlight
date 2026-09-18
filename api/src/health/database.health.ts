/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { MikroORM } from '@mikro-orm/core';

@Injectable()
export class DatabaseHealth {
  constructor(
    private readonly orm: MikroORM,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string = 'database') {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.orm.em.getConnection().execute('SELECT 1');
      return indicator.up({
        type: 'database',
        message: 'Database connection is healthy',
      });
    } catch (error) {
      return indicator.down({
        type: 'database',
        message:
          error instanceof Error ? error.message : 'Database unavailable',
      });
    }
  }
}
