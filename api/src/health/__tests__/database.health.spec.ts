/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseHealth } from '#/health/database.health.js';
import { HealthIndicatorService } from '@nestjs/terminus';
import { MikroORM } from '@mikro-orm/core';

describe('DatabaseHealth', () => {
  let service: DatabaseHealth;
  let orm: MikroORM;
  let healthIndicatorService: HealthIndicatorService;
  let connection: any;

  const mockConnection = () => ({
    execute: vi.fn(),
  });

  const mockEm = () => ({
    getConnection: vi.fn(() => connection),
  });

  const mockOrm = () => {
    connection = mockConnection();
    const em = mockEm();
    return {
      em,
    } as unknown as MikroORM;
  };

  const mockHealthIndicatorService = () => {
    const indicator = {
      up: vi.fn((result) => result),
      down: vi.fn((result) => result),
    };
    const checkMock = vi.fn(() => indicator);
    return {
      check: checkMock,
    } as unknown as HealthIndicatorService;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orm = mockOrm();
    healthIndicatorService = mockHealthIndicatorService();
    service = new DatabaseHealth(orm, healthIndicatorService);
  });

  describe('isHealthy', () => {
    it('should return up when database is reachable', async () => {
      connection.execute.mockResolvedValue(undefined);

      await service.isHealthy('db');

      expect(connection.execute).toHaveBeenCalledWith('SELECT 1');
      expect(healthIndicatorService.check).toHaveBeenCalledWith('db');
      const indicator = (
        healthIndicatorService.check as ReturnType<typeof vi.fn>
      ).mock.results[0].value;
      expect(indicator.up).toHaveBeenCalledWith({
        type: 'database',
        message: 'Database connection is healthy',
      });
    });

    it('should return down when database throws', async () => {
      connection.execute.mockRejectedValue(new Error('Connection refused'));

      await service.isHealthy('db');

      const indicator = (
        healthIndicatorService.check as ReturnType<typeof vi.fn>
      ).mock.results[0].value;
      expect(indicator.down).toHaveBeenCalledWith({
        type: 'database',
        message: 'Connection refused',
      });
    });

    it('should handle non-Error throwables', async () => {
      connection.execute.mockRejectedValue('string error');

      await service.isHealthy('db');

      const indicator = (
        healthIndicatorService.check as ReturnType<typeof vi.fn>
      ).mock.results[0].value;
      expect(indicator.down).toHaveBeenCalledWith({
        type: 'database',
        message: 'Database unavailable',
      });
    });

    it('should use the default key when none is provided', async () => {
      connection.execute.mockResolvedValue(undefined);

      await service.isHealthy();

      expect(healthIndicatorService.check).toHaveBeenCalledWith('database');
    });
  });
});
