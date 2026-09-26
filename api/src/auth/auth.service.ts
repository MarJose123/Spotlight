/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@/users/entities/user.entity';
import bcrypt from 'bcrypt';
import { CredentialDto } from '@/auth/dto/credential.dto';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { TokenService } from '@/auth/token.service';
import { RefreshToken } from '@/auth/entities/refresh-token.entity';
import { UserStatus } from '@/users/enums/status.enum';
import { InjectRepository } from '@mikro-orm/nestjs';
import { JwtTokenMapper } from '@/auth/mappers/jwt-token.mapper';
import { JwtTokenResponse } from '@/auth/dto/jwt-token-response.dto';

/** Returned for every failed login, so responses cannot enumerate accounts. */
export const INVALID_CREDENTIALS_MESSAGE =
  'These credentials do not match our records.';

/** Must stay in step with `signOptions.expiresIn` in `auth.module.ts`. */
export const ACCESS_TOKEN_TTL_SECONDS = 300;

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: EntityRepository<RefreshToken>,
    private readonly em: EntityManager,
  ) {}

  /** Validates the user email and returns true if it exists. */
  async validateUserEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      email,
      status: UserStatus.ACTIVE,
    });
    if (!user) {
      return null;
    }

    return user;
  }

  /**
   * Logs in a user by email and password.
   */
  async authenticate(cred: CredentialDto): Promise<JwtTokenResponse> {
    const user = await this.userRepository.findOne({ email: cred.email });
    if (
      !user ||
      !(user.password && (await bcrypt.compare(cred.password, user.password)))
    ) {
      throw new UnauthorizedException({
        message: INVALID_CREDENTIALS_MESSAGE,
      });
    }

    return this.issueTokensFor(user);
  }

  /** Shared by password login and social sign-in, so both yield one session. */
  async issueTokensFor(user: User): Promise<JwtTokenResponse> {
    const accessToken = this.tokenService.createAccessToken(user);
    const refreshToken = this.tokenService.createRefreshToken();

    const refreshTokenModel = new RefreshToken();
    Object.assign(refreshTokenModel, {
      userId: user.id,
      tokenHash: this.tokenService.hashRefreshToken(refreshToken),
      expiresAt: this.getRefreshTokenExpiration(),
    });

    this.refreshTokenRepository.create(refreshTokenModel);
    await this.em.flush();

    return JwtTokenMapper.toResponse({
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      token_type: 'Bearer',
    });
  }

  /**
   * Refreshes the access token using the refresh token.
   */
  async refresh(token: string): Promise<JwtTokenResponse> {
    const tokenHash = this.tokenService.hashRefreshToken(token);
    const storedToken = await this.refreshTokenRepository.findOne({
      tokenHash,
    });
    if (!storedToken)
      throw new UnauthorizedException({ message: 'Invalid refresh token' });
    if (storedToken.expiresAt.getTime() < Date.now())
      throw new UnauthorizedException({ message: 'Refresh token expired' });
    if (storedToken.revokedAt)
      throw new UnauthorizedException({ message: 'Refresh token revoked' });

    const user = await this.userRepository.findOne({
      id: storedToken.userId,
      status: UserStatus.ACTIVE,
    });
    if (!user)
      throw new UnauthorizedException({
        message: 'Invalid authenticated user',
      });

    const newAccessToken = this.tokenService.createAccessToken(user);

    return JwtTokenMapper.toResponse({
      user,
      access_token: newAccessToken,
      refresh_token: token,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      token_type: 'Bearer',
    });
  }

  /**
   * Logs out the user by revoking the refresh token. The token must belong to
   * the authenticated user, so one user cannot revoke another's session.
   */
  async logout(refreshToken: string, userId: string) {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      tokenHash,
      userId,
    });
    if (!storedToken) return;

    storedToken.revokedAt = new Date();
    await this.em.flush();
  }

  /**
   * Returns the expiration date for the refresh token.
   */
  private getRefreshTokenExpiration(): Date {
    // 24 hours
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}
