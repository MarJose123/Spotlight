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
