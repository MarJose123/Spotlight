/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthService } from '#/auth/oauth.service.js';
import { User } from '#/users/entities/user.entity.js';
import { UserStatus } from '#/users/enums/status.enum.js';
import type { OAuthStrategy } from '#/auth/interface/oauth.interface.js';

const mockProfile = {
  email: 'test@example.com',
  emailVerified: true,
  name: 'SSO Name',
  avatar: 'https://example.com/avatar.png',
};

const mockStrategy = {
  name: 'zoho',
  isEnabled: () => true,
  authorizeUrl: vi.fn(),
  profile: vi.fn().mockResolvedValue(mockProfile),
} as unknown as OAuthStrategy;

vi.mock('#/auth/strategies/zoho.strategy.js', () => ({
  ZohoStrategy: vi.fn(() => mockStrategy),
}));

describe('OAuthService', () => {
  let service: OAuthService;
  let userRepository: any;
  let em: any;
  let authService: any;

  const makeUser = (overrides = {}): User => {
    const user = new User();
    Object.assign(user, {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
    return user;
  };

  const mockUserRepo = () => ({
    findOne: vi.fn(),
  });

  const mockEm = () => ({
    flush: vi.fn(() => Promise.resolve()),
  });

  const mockAuthService = () => ({
    issueTokensFor: vi.fn((user) => ({
      access_token: 'access',
      refresh_token: 'refresh',
      user,
    })),
  });

  const mockConfig = () => ({
    get: vi.fn((key: string) => {
      if (key === 'services.allowedDomains') return ['example.com'];
      return undefined;
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository = mockUserRepo();
    em = mockEm();
    authService = mockAuthService();

    // Reset the strategy mock
    vi.mocked(mockStrategy.profile).mockResolvedValue(mockProfile);

    service = new OAuthService(
      em,
      mockConfig() as any,
      authService,
      userRepository,
      mockStrategy as any,
    );
  });

  describe('login', () => {
    it('should return tokens when the user exists and is active', async () => {
      userRepository.findOne.mockResolvedValue(makeUser());

      const result = await service.login('zoho', 'code', 'verifier');

      expect(result.access_token).toBe('access');
      expect(authService.issueTokensFor).toHaveBeenCalled();
    });

    it('should reject when email is not verified', async () => {
      vi.mocked(mockStrategy.profile).mockResolvedValue({
        email: 'test@example.com',
        emailVerified: false,
      });

      await expect(service.login('zoho', 'code', 'verifier')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject when the email domain is not allowed', async () => {
      vi.mocked(mockStrategy.profile).mockResolvedValue({
        email: 'test@blocked.com',
        emailVerified: true,
      });

      await expect(service.login('zoho', 'code', 'verifier')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject when no user matches the email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login('zoho', 'code', 'verifier')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject when the user is inactive', async () => {
      userRepository.findOne.mockResolvedValue(
        makeUser({ status: UserStatus.INACTIVE }),
      );

      await expect(service.login('zoho', 'code', 'verifier')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject unknown provider', async () => {
      await expect(service.login('google', 'code', 'verifier')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolve - avatar and username', () => {
    it('should update avatar when the user has none', async () => {
      const user = makeUser({ avatar: undefined });
      userRepository.findOne.mockResolvedValue(user);

      await service.login('zoho', 'code', 'verifier');

      expect(user.avatar).toBe('https://example.com/avatar.png');
      expect(em.flush).toHaveBeenCalled();
    });

    it('should not overwrite an existing avatar', async () => {
      const user = makeUser({ avatar: 'https://own.com/me.png' });
      userRepository.findOne.mockResolvedValue(user);

      await service.login('zoho', 'code', 'verifier');

      expect(user.avatar).toBe('https://own.com/me.png');
      expect(em.flush).not.toHaveBeenCalled();
    });

    it('should not update username on SSO login', async () => {
      const user = makeUser({ username: undefined });
      userRepository.findOne.mockResolvedValue(user);

      await service.login('zoho', 'code', 'verifier');

      // Username should remain undefined — SSO does not touch it.
      expect(user.username).toBeUndefined();
    });

    it('should not overwrite an existing username on SSO login', async () => {
      const user = makeUser({ username: 'my-handle' });
      userRepository.findOne.mockResolvedValue(user);

      await service.login('zoho', 'code', 'verifier');

      expect(user.username).toBe('my-handle');
    });
  });
});
