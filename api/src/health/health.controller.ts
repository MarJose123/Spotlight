import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealth } from './database.health';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { seconds, Throttle } from '@nestjs/throttler';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: DatabaseHealth,
    private disk: DiskHealthIndicator,
  ) {}

  @ApiOperation({
    summary: 'Status',
    description: 'Check the health of the application',
  })
  @ApiOkResponse({ summary: 'Health check successful' })
  @Get()
  @HealthCheck()
  @Throttle({ default: { limit: 3, ttl: seconds(2) } })
  check() {
    return this.health.check([
      () => this.db.isHealthy(),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          threshold: 250 * 1024 * 1024 * 1024,
        }),
    ]);
  }
}
