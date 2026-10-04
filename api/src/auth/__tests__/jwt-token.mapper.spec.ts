/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect } from 'vitest';
import { JwtTokenMapper } from '#/auth/mappers/jwt-token.mapper.js';
import { User } from '#/users/entities/user.entity.js';
import { UserStatus } from '#/users/enums/status.enum.js';
import { UserRole } from '#/users/enums/role.enum.js';

describe('JwtTokenMapper', () => {
  const makeUser = () => {
    const user = new User();
    Object.assign(user, {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      status: UserStatus.ACTIVE,
      type: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return user;
  };

  describe('toResponse', () => {
    it('should map token and user to response DTO', () => {
      const user = makeUser();
      const result = JwtTokenMapper.toResponse({
        user,
        access_token: 'access-123',
        refresh_token: 'refresh-123',
        expires_in: 300,
      });

      expect(result.access_token).toBe('access-123');
      expect(result.refresh_token).toBe('refresh-123');
      expect(result.expires_in).toBe(300);
      expect(result.token_type).toBe('Bearer');
      expect(result.user).not.toBeNull();
      expect(result.user!.id).toBe('user-123');
      expect(result.user!.email).toBe('test@example.com');
    });

    it('should return null user when input user is undefined', () => {
      const result = JwtTokenMapper.toResponse({
        user: undefined,
        access_token: 'access-123',
        refresh_token: 'refresh-123',
        expires_in: 300,
      });

      expect(result.user).toBeNull();
    });
  });
});
