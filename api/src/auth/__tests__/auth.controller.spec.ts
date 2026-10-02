/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AuthController } from '@/auth/auth.controller';
import { OAuthService } from '@/auth/oauth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let oauthService: OAuthService;

  const mockOAuthService = () => ({
    enabledProviders: vi.fn(),
    authorizeUrl: vi.fn(),
    login: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    oauthService = mockOAuthService() as unknown as OAuthService;
    controller = new AuthController(oauthService);
  });

  describe('getProviders', () => {
    it('should return the list of enabled providers', () => {
      vi.mocked(oauthService.enabledProviders).mockReturnValue(['zoho']);

      const result = controller.getProviders();

      expect(result).toEqual(['zoho']);
      expect(oauthService.enabledProviders).toHaveBeenCalled();
    });

    it('should return an empty array when no providers are enabled', () => {
      vi.mocked(oauthService.enabledProviders).mockReturnValue([]);

      const result = controller.getProviders();

      expect(result).toEqual([]);
    });
  });

  describe('getAuthorizeUrl', () => {
    it('should return the authorize URL for a valid provider', () => {
      const expectedUrl = 'https://accounts.zoho.com/oauth/v2/auth?challenge=abc';
      vi.mocked(oauthService.authorizeUrl).mockReturnValue(expectedUrl);

      const result = controller.getAuthorizeUrl('zoho', {
        code_challenge: 'abc',
        state: 'state-123',
      });

      expect(result).toEqual({ url: expectedUrl });
      expect(oauthService.authorizeUrl).toHaveBeenCalledWith('zoho', {
        codeChallenge: 'abc',
        state: 'state-123',
      });
    });

    it('should throw NotFoundException for an unknown provider', () => {
      vi.mocked(oauthService.authorizeUrl).mockImplementation(() => {
        throw new NotFoundException();
      });

      expect(() =>
        controller.getAuthorizeUrl('google', {
          code_challenge: 'abc',
          state: 'state-123',
        }),
      ).toThrow(NotFoundException);
    });
  });

  describe('exchange', () => {
    it('should return tokens for a valid code exchange', async () => {
      const tokens = {
        access_token: 'access',
        refresh_token: 'refresh',
        expires_in: 300,
        token_type: 'Bearer',
      };
      vi.mocked(oauthService.login).mockResolvedValue(tokens);

      const result = await controller.exchange('zoho', {
        code: 'auth-code',
        code_verifier: 'verifier',
      });

      expect(result).toBe(tokens);
      expect(oauthService.login).toHaveBeenCalledWith('zoho', 'auth-code', 'verifier');
    });

    it('should throw NotFoundException for an unknown provider', async () => {
      vi.mocked(oauthService.login).mockRejectedValue(new NotFoundException());

      await expect(
        controller.exchange('google', {
          code: 'code',
          code_verifier: 'verifier',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when user is unprovisioned', async () => {
      vi.mocked(oauthService.login).mockRejectedValue(
        new Error('User is not provisioned'),
      );

      await expect(
        controller.exchange('zoho', {
          code: 'code',
          code_verifier: 'verifier',
        }),
      ).rejects.toThrow('User is not provisioned');
    });
  });
});
