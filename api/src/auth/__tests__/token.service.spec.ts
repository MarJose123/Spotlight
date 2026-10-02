/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '@/auth/token.service';
import { User } from '@/users/entities/user.entity';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    } as unknown as JwtService;
    service = new TokenService(jwtService);
  });

  describe('createAccessToken', () => {
    it('should sign a token with the user sub and email', () => {
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const expectedToken = 'jwt-token-123';
      vi.mocked(jwtService.sign).mockReturnValue(expectedToken);

      const user = new User();
      user.id = 'user-123';
      user.email = 'test@example.com';

      const result = service.createAccessToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'user-123',
      });
      expect(result).toBe(expectedToken);
    });
  });

  describe('createRefreshToken', () => {
    it('should return a hex string', () => {
      const token = service.createRefreshToken();
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should return 128 hex chars (64 bytes)', () => {
      const token = service.createRefreshToken();
      expect(token.length).toBe(128);
    });

    it('should return a unique token each call', () => {
      const a = service.createRefreshToken();
      const b = service.createRefreshToken();
      expect(a).not.toBe(b);
    });
  });

  describe('hashRefreshToken', () => {
    it('should return a 64-char hex SHA-256 digest', () => {
      const hash = service.hashRefreshToken('some-token');
      expect(hash.length).toBe(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('should be deterministic for the same input', () => {
      const hashA = service.hashRefreshToken('same-token');
      const hashB = service.hashRefreshToken('same-token');
      expect(hashA).toBe(hashB);
    });

    it('should differ for different inputs', () => {
      const hashA = service.hashRefreshToken('token-a');
      const hashB = service.hashRefreshToken('token-b');
      expect(hashA).not.toBe(hashB);
    });

    it('should throw when input is undefined', () => {
      expect(() => service.hashRefreshToken(undefined as never)).toThrow();
    });
  });
});
