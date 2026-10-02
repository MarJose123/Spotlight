/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from '@/auth/auth.service';
import type { AuthenticatedUserDto } from '@/auth/dto/authenticated-user.dto';
import type { UserResponseDto } from '@/users/dto/user-response.dto';

describe('AppController', () => {
  let controller: AppController;
  let authService: AuthService;

  const mockAuthService = () => ({
    validateUserEmail: vi.fn(),
    authenticate: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  });

  const makeAuth = (overrides = {}): AuthenticatedUserDto => ({
    sub: 'user-123',
    iat: Date.now(),
    exp: Date.now() + 300,
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      status: 'ACTIVE',
      role: 'USER',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as UserResponseDto,
    ...overrides,
  });

  const makeReq = (auth: AuthenticatedUserDto) => ({
    auth,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authService = mockAuthService() as unknown as AuthService;
    controller = new AppController(authService);
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const tokens = { access_token: 'access', refresh_token: 'refresh', expires_in: 300, token_type: 'Bearer' };
      vi.mocked(authService.validateUserEmail).mockResolvedValue(user as never);
      vi.mocked(authService.authenticate).mockResolvedValue(tokens);

      const result = await controller.login({ email: 'test@example.com', password: 'secret' });

      expect(result).toBe(tokens);
      expect(authService.authenticate).toHaveBeenCalledWith({ email: 'test@example.com', password: 'secret' });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      vi.mocked(authService.validateUserEmail).mockResolvedValue(null);

      await expect(
        controller.login({ email: 'missing@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return the invalid credentials message for unknown user', async () => {
      vi.mocked(authService.validateUserEmail).mockResolvedValue(null);

      try {
        await controller.login({ email: 'nope@example.com', password: 'x' });
        expect.fail('should have thrown');
      } catch (e: any) {
        expect(e.response.message).toBe(INVALID_CREDENTIALS_MESSAGE);
      }
    });
  });

  describe('logout', () => {
    it('should call authService.logout with refresh token and user id', async () => {
      const auth = makeAuth();
      const req = makeReq(auth);

      await controller.logout('refresh-123', req as never);

      expect(authService.logout).toHaveBeenCalledWith('refresh-123', 'user-123');
    });

    it('should throw UnauthorizedException when auth.sub is missing', async () => {
      const auth = makeAuth({ sub: undefined });
      const req = makeReq(auth);

      await expect(controller.logout('refresh-123', req as never)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens for a valid refresh token', async () => {
      const tokens = { access_token: 'new-access', refresh_token: 'same-refresh', expires_in: 300, token_type: 'Bearer' };
      vi.mocked(authService.refresh).mockResolvedValue(tokens);

      const result = await controller.refresh('refresh-123');

      expect(result).toBe(tokens);
      expect(authService.refresh).toHaveBeenCalledWith('refresh-123');
    });

    it('should propagate the error when refresh token is invalid', async () => {
      vi.mocked(authService.refresh).mockRejectedValue(new Error('Invalid refresh token'));

      await expect(controller.refresh('bad-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should propagate TypeError when refresh token is undefined', async () => {
      vi.mocked(authService.refresh).mockRejectedValue(new TypeError('The first argument must be of type string'));

      await expect(controller.refresh(undefined as never)).rejects.toThrow(TypeError);
    });
  });

  describe('login', () => {
    it('should propagate UnauthorizedException when password is wrong', async () => {
      vi.mocked(authService.validateUserEmail).mockResolvedValue({ id: 'user-123', email: 'test@example.com' } as never);
      vi.mocked(authService.authenticate).mockRejectedValue(
        new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE),
      );

      await expect(
        controller.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
