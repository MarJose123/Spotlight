/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthController } from '#/health/health.controller.js';
import {
  HealthCheckService,
  HttpHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealth } from '#/health/database.health.js';

describe('HealthController', () => {
  let controller: HealthController;
  let health: HealthCheckService;
  let http: HttpHealthIndicator;
  let db: DatabaseHealth;
  let disk: DiskHealthIndicator;

  const mockHealthCheckService = () => ({
    check: vi.fn(),
  });

  const mockHttpHealthIndicator = () => ({});

  const mockDatabaseHealth = () => ({
    isHealthy: vi.fn(),
  });

  const mockDiskHealthIndicator = () => ({
    checkStorage: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    health = mockHealthCheckService() as unknown as HealthCheckService;
    http = mockHttpHealthIndicator() as unknown as HttpHealthIndicator;
    db = mockDatabaseHealth() as unknown as DatabaseHealth;
    disk = mockDiskHealthIndicator() as unknown as DiskHealthIndicator;
    controller = new HealthController(health, http, db, disk);
  });

  describe('check', () => {
    it('should call health.check with db and disk checks', async () => {
      const dbResult = { database: { status: 'up' as const } };
      const diskResult = { storage: { status: 'up' as const } };
      vi.mocked(db.isHealthy).mockReturnValue(
        Promise.resolve(dbResult) as never,
      );
      vi.mocked(disk.checkStorage).mockReturnValue(
        Promise.resolve(diskResult) as never,
      );
      vi.mocked(health.check).mockResolvedValue({
        status: 'ok',
        details: { ...dbResult, ...diskResult },
      });

      await controller.check();

      expect(health.check).toHaveBeenCalled();
      const checkFn = vi.mocked(health.check).mock.calls[0][0];
      expect(Array.isArray(checkFn)).toBe(true);
      expect(checkFn.length).toBe(2);
    });

    it('should propagate health check results', async () => {
      const dbResult = { database: { status: 'up' as const } };
      const diskResult = { storage: { status: 'up' as const } };
      vi.mocked(db.isHealthy).mockReturnValue(
        Promise.resolve(dbResult) as never,
      );
      vi.mocked(disk.checkStorage).mockReturnValue(
        Promise.resolve(diskResult) as never,
      );
      const expected = {
        database: { status: 'up' as const },
        storage: { status: 'up' as const },
      };
      vi.mocked(health.check).mockResolvedValue({
        status: 'ok',
        details: expected,
      });

      const result = await controller.check();

      expect(result.details).toEqual(expected);
    });

    it('should pass disk threshold to checkStorage', async () => {
      vi.mocked(db.isHealthy).mockReturnValue(Promise.resolve({}) as never);
      vi.mocked(disk.checkStorage).mockReturnValue(
        Promise.resolve({}) as never,
      );
      vi.mocked(health.check).mockResolvedValue({
        status: 'ok',
        details: {},
      });

      await controller.check();

      // The controller passes functions to health.check, not calling disk directly
      const checkFn = vi.mocked(health.check).mock.calls[0][0];
      expect(Array.isArray(checkFn)).toBe(true);
      expect(checkFn.length).toBe(2);
      // Invoke the second function to verify disk.checkStorage is called
      await checkFn[1]();
      expect(disk.checkStorage).toHaveBeenCalledWith('storage', {
        path: '/',
        threshold: 250 * 1024 * 1024 * 1024,
      });
    });

    it('should propagate health check failure when database is down', async () => {
      const dbResult = { database: { status: 'down' as const } };
      const diskResult = { storage: { status: 'up' as const } };
      vi.mocked(db.isHealthy).mockReturnValue(
        Promise.resolve(dbResult) as never,
      );
      vi.mocked(disk.checkStorage).mockReturnValue(
        Promise.resolve(diskResult) as never,
      );
      const failed = {
        database: { status: 'down' as const },
        storage: { status: 'up' as const },
      };
      vi.mocked(health.check).mockResolvedValue({
        status: 'error',
        details: failed,
      });

      const result = await controller.check();

      expect(result.details.database.status).toBe('down');
    });
  });
});
