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
