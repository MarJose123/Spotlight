/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserMapper } from '#/users/mappers/user.mapper.js';
import { User } from '#/users/entities/user.entity.js';
import { UserStatus } from '#/users/enums/status.enum.js';
import { UserRole } from '#/users/enums/role.enum.js';

const mockBucketService = () => ({
  getTemporaryUrl: vi.fn(
    async (key: string) => `https://presigned.example.com/${key}`,
  ),
});

describe('UserMapper', () => {
  let mapper: UserMapper;
  let bucketService: any;

  const makeUser = (overrides = {}) => {
    const user = new User();
    Object.assign(user, {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      avatar: 'avatars/user-123.png',
      status: UserStatus.ACTIVE,
      type: UserRole.USER,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-06-01'),
      ...overrides,
    });
    return user;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    bucketService = mockBucketService();
    mapper = new UserMapper(bucketService);
  });

  describe('toResponse', () => {
    it('should return null for undefined input', async () => {
      const result = await mapper.toResponse(undefined);
      expect(result).toBeNull();
    });

    it('should map all user fields and convert avatar key to URL', async () => {
      const user = makeUser();
      const result = await mapper.toResponse(user);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('user-123');
      expect(result!.email).toBe('test@example.com');
      expect(result!.name).toBe('Test User');
      expect(result!.username).toBe('testuser');
      expect(result!.displayName).toBe('Test User');
      expect(result!.avatarUrl).toBe(
        'https://presigned.example.com/avatars/user-123.png',
      );
      expect(result!.status).toBe(UserStatus.ACTIVE);
      expect(result!.role).toBe(UserRole.USER);
      expect(result!.createdAt).toEqual(new Date('2024-01-01'));
      expect(result!.updatedAt).toEqual(new Date('2024-06-01'));
      expect(bucketService.getTemporaryUrl).toHaveBeenCalledWith(
        'avatars/user-123.png',
      );
    });

    it('should handle missing optional fields', async () => {
      const user = makeUser({ username: undefined, avatar: undefined });
      const result = await mapper.toResponse(user);

      expect(result!.username).toBeUndefined();
      expect(result!.avatarUrl).toBeUndefined();
      expect(bucketService.getTemporaryUrl).not.toHaveBeenCalled();
    });
  });
});
