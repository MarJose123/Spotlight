/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealth } from './database.health.js';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { seconds, Throttle } from '@nestjs/throttler';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: DatabaseHealth,
    private disk: DiskHealthIndicator,
    private readonly config: ConfigService,
  ) {}

  @ApiOperation({
    summary: 'Status',
    description: 'Check the health of the application and its dependencies.',
  })
  @ApiOkResponse({ description: 'Health check successful.' })
  @ApiServiceUnavailableResponse({
    description: 'One or more dependencies are unhealthy.',
  })
  @Get()
  @HealthCheck()
  @Throttle({ default: { limit: 3, ttl: seconds(2) } })
  check() {
    // Skip disk check in development — it causes false failures on developer
    // machines with large disks and is only meaningful for production monitoring.
    if (process.env.NODE_ENV === 'development') {
      return this.health.check([() => this.db.isHealthy()]);
    }

    const thresholdGb =
      Number(this.config.get('HEALTH_DISK_THRESHOLD_GB', 250)) || 250;
    return this.health.check([
      () => this.db.isHealthy(),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          threshold: thresholdGb * 1024 * 1024 * 1024,
        }),
    ]);
  }
}
