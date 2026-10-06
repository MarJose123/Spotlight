/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { UserMapper } from '#/users/mappers/user.mapper.js';
import { User } from '#/users/entities/user.entity.js';
import { UserStatus } from '#/users/enums/status.enum.js';
import { UserRole } from '#/users/enums/role.enum.js';

describe('UserMapper', () => {
  let mapper: UserMapper;

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
    mapper = new UserMapper();
  });

  describe('toResponse', () => {
    it('should return null for undefined input', () => {
      const result = mapper.toResponse(undefined);
      expect(result).toBeNull();
    });

    it('should map all user fields and convert avatar key to API path', () => {
      const user = makeUser();
      const result = mapper.toResponse(user);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('user-123');
      expect(result!.email).toBe('test@example.com');
      expect(result!.name).toBe('Test User');
      expect(result!.username).toBe('testuser');
      expect(result!.displayName).toBe('Test User');
      expect(result!.avatarUrl).toBe(
        '/api/v1/posts/attachment/avatars%2Fuser-123.png',
      );
      expect(result!.status).toBe(UserStatus.ACTIVE);
      expect(result!.role).toBe(UserRole.USER);
      expect(result!.createdAt).toEqual(new Date('2024-01-01'));
      expect(result!.updatedAt).toEqual(new Date('2024-06-01'));
    });

    it('should handle missing optional fields', () => {
      const user = makeUser({ username: undefined, avatar: undefined });
      const result = mapper.toResponse(user);

      expect(result!.username).toBeUndefined();
      expect(result!.avatarUrl).toBeUndefined();
    });
  });
});
