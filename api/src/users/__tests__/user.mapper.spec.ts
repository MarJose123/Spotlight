/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect } from 'vitest';
import { UserMapper } from '@/users/mappers/user.mapper';
import { User } from '@/users/entities/user.entity';
import { UserStatus } from '@/users/enums/status.enum';
import { UserRole } from '@/users/enums/role.enum';

describe('UserMapper', () => {
  const makeUser = (overrides = {}) => {
    const user = new User();
    Object.assign(user, {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      avatar: 'https://example.com/avatar.png',
      status: UserStatus.ACTIVE,
      type: UserRole.USER,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-06-01'),
      ...overrides,
    });
    return user;
  };

  describe('toResponse', () => {
    it('should return null for undefined input', () => {
      expect(UserMapper.toResponse(undefined)).toBeNull();
    });

    it('should map all user fields', () => {
      const user = makeUser();
      const result = UserMapper.toResponse(user);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('user-123');
      expect(result!.email).toBe('test@example.com');
      expect(result!.name).toBe('Test User');
      expect(result!.username).toBe('testuser');
      expect(result!.displayName).toBe('Test User');
      expect(result!.avatarUrl).toBe('https://example.com/avatar.png');
      expect(result!.status).toBe(UserStatus.ACTIVE);
      expect(result!.role).toBe(UserRole.USER);
      expect(result!.createdAt).toEqual(new Date('2024-01-01'));
      expect(result!.updatedAt).toEqual(new Date('2024-06-01'));
    });

    it('should handle missing optional fields', () => {
      const user = makeUser({ username: undefined, avatar: undefined });
      const result = UserMapper.toResponse(user);

      expect(result!.username).toBeUndefined();
      expect(result!.avatarUrl).toBeUndefined();
    });
  });
});
