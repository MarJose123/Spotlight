/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/core';
import { RefreshToken } from '@/auth/entities/refresh-token.entity';

@Injectable()
export class TokenCron {
  constructor(private readonly em: EntityManager) {}

  private readonly logger = new Logger('RefreshToken');

  @Cron(CronExpression.EVERY_HOUR)
  async removeExpiredRefreshToken() {
    this.logger.log('Removing expired refresh tokens');
    const deleted = await this.em.nativeDelete(RefreshToken, {
      expiresAt: { $lt: new Date() },
    });
    this.logger.warn(`Removed ${deleted} expired refresh tokens`);
  }
}
