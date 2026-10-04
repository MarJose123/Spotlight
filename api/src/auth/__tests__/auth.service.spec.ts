/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import {
  AuthService,
  INVALID_CREDENTIALS_MESSAGE,
  ACCESS_TOKEN_TTL_SECONDS,
} from '#/auth/auth.service.js';
import { TokenService } from '#/auth/token.service.js';
import { User } from '#/users/entities/user.entity.js';
import { RefreshToken } from '#/auth/entities/refresh-token.entity.js';
import { UserStatus } from '#/users/enums/status.enum.js';
import { EntityManager } from '@mikro-orm/core';

// Mock bcrypt so authenticate can succeed without a real hash
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
  },
}));

import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let tokenService: TokenService;
  let userRepository: any;
  let refreshTokenRepository: any;
  let em: EntityManager;

  const makeUser = (overrides = {}): User => {
    const user = new User();
    Object.assign(user, {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: '$2b$12$LJ3m4R3kN5xK7vQ9wY2HDOmF1Gh8JbTcXzP4aSdFgHjKlZxYwQrUt',
      status: UserStatus.ACTIVE,
      type: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
    return user;
  };

  const mockTokenService = () => ({
    createAccessToken: vi.fn(() => 'access-token-123'),
    createRefreshToken: vi.fn(() => 'refresh-token-123'),
    hashRefreshToken: vi.fn((t: string) => `hash-${t}`),
  });

  const mockEm = () => ({
    flush: vi.fn(() => Promise.resolve()),
  });

  const mockUserRepo = (findOneResult = null) => ({
    findOne: vi.fn(() => Promise.resolve(findOneResult)),
    create: vi.fn(),
  });

  const mockRefreshTokenRepo = (findOneResult = null) => ({
    findOne: vi.fn(() => Promise.resolve(findOneResult)),
    create: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    tokenService = mockTokenService() as unknown as TokenService;
    userRepository = mockUserRepo();
    refreshTokenRepository = mockRefreshTokenRepo();
    em = mockEm() as unknown as EntityManager;
    service = new AuthService(
      tokenService,
      userRepository,
      refreshTokenRepository,
      em,
    );
  });

  describe('validateUserEmail', () => {
    it('should return the user when email matches and status is active', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUserEmail('test@example.com');
      expect(result).toBe(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
      });
    });

    it('should return null when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.validateUserEmail('missing@example.com');
      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.validateUserEmail('inactive@example.com');
      expect(result).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('should return tokens for valid credentials', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValue(user);
      vi.mocked(tokenService.createAccessToken).mockReturnValue('new-access');
      vi.mocked(tokenService.createRefreshToken).mockReturnValue('new-refresh');

      const result = await service.authenticate({
        email: 'test@example.com',
        password: 'correct-password',
      });

      expect(result.access_token).toBe('new-access');
      expect(result.refresh_token).toBe('new-refresh');
      expect(result.expires_in).toBe(ACCESS_TOKEN_TTL_SECONDS);
      expect(result.token_type).toBe('Bearer');
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.authenticate({
          email: 'nope@example.com',
          password: 'anything',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      await expect(
        service.authenticate({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not reveal whether the account exists', async () => {
      userRepository.findOne.mockResolvedValue(null);

      try {
        await service.authenticate({
          email: 'unknown@example.com',
          password: 'pass',
        });
        expect.fail('should have thrown');
      } catch (e: any) {
        expect(e.response.message).toBe(INVALID_CREDENTIALS_MESSAGE);
      }
    });
  });

  describe('issueTokensFor', () => {
    it('should persist a refresh token hash', async () => {
      const user = makeUser();

      await service.issueTokensFor(user);

      expect(refreshTokenRepository.create).toHaveBeenCalled();
      const createdToken = refreshTokenRepository.create.mock.calls[0][0];
      expect(createdToken.userId).toBe(user.id);
      expect(createdToken.tokenHash).toBe('hash-refresh-token-123');
      expect(em.flush).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should issue a new access token for a valid refresh token', async () => {
      const storedToken = new RefreshToken();
      storedToken.userId = 'user-123';
      storedToken.expiresAt = new Date(Date.now() + 1000 * 60 * 60);
      storedToken.revokedAt = undefined;

      refreshTokenRepository.findOne.mockResolvedValue(storedToken);
      userRepository.findOne.mockResolvedValue(makeUser());
      vi.mocked(tokenService.createAccessToken).mockReturnValue('new-access');

      const result = await service.refresh('refresh-token-123');

      expect(result.access_token).toBe('new-access');
      expect(result.refresh_token).toBe('refresh-token-123');
    });

    it('should reject an unknown refresh token', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh('unknown')).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should reject an expired refresh token', async () => {
      const storedToken = new RefreshToken();
      storedToken.expiresAt = new Date(Date.now() - 1000);
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);

      await expect(service.refresh('expired')).rejects.toThrow(
        'Refresh token expired',
      );
    });

    it('should reject a revoked refresh token', async () => {
      const storedToken = new RefreshToken();
      storedToken.expiresAt = new Date(Date.now() + 1000 * 60 * 60);
      storedToken.revokedAt = new Date();
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);

      await expect(service.refresh('revoked')).rejects.toThrow(
        'Refresh token revoked',
      );
    });

    it('should reject if the user is no longer active', async () => {
      const storedToken = new RefreshToken();
      storedToken.userId = 'user-123';
      storedToken.expiresAt = new Date(Date.now() + 1000 * 60 * 60);
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh('valid-token')).rejects.toThrow(
        'Invalid authenticated user',
      );
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      const storedToken = new RefreshToken();
      storedToken.userId = 'user-123';
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);

      await service.logout('refresh-token-123', 'user-123');

      expect(storedToken.revokedAt).toBeInstanceOf(Date);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should silently skip when the token does not belong to the user', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await service.logout('refresh-token-123', 'user-123');

      expect(em.flush).not.toHaveBeenCalled();
    });

    it('should silently skip when the token belongs to a different user', async () => {
      // The logout method queries by tokenHash AND userId, so a token belonging
      // to another user is not found and the method returns early.
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await service.logout('refresh-token-123', 'user-123');

      expect(em.flush).not.toHaveBeenCalled();
    });
  });
});
