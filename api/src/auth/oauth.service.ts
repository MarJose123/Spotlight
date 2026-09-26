/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ZohoStrategy } from '@/auth/strategies/zoho.strategy';
import { AuthService } from '@/auth/auth.service';
import { User } from '@/users/entities/user.entity';
import { UserStatus } from '@/users/enums/status.enum';
import { JwtTokenResponse } from '@/auth/dto/jwt-token-response.dto';
import type {
  OAuthAuthorizeParams,
  OAuthProfile,
  OAuthStrategy,
} from '@/auth/interface/oauth.interface';

/** One message for every rejection, so responses cannot enumerate accounts. */
export const UNPROVISIONED_MESSAGE =
  'This account is not authorised to use Spotlight.';

/**
 * Stateless: no provider tokens, no CSRF state, no handoff code. The client
 * owns the redirect and the PKCE verifier, so this only sees a finished code.
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly zoho: ZohoStrategy,
  ) {}

  private strategies(): OAuthStrategy[] {
    return [this.zoho];
  }

  private strategy(name: string): OAuthStrategy {
    const strategy = this.strategies().find(
      (candidate) => candidate.name === name,
    );
    if (!strategy) {
      // Unknown and unimplemented providers are indistinguishable on purpose.
      throw new NotFoundException();
    }
    return strategy;
  }

  enabledProviders(): string[] {
    return this.strategies()
      .filter((strategy) => strategy.isEnabled())
      .map((strategy) => strategy.name);
  }

  authorizeUrl(provider: string, params: OAuthAuthorizeParams): string {
    return this.strategy(provider).authorizeUrl(params);
  }

  /** Returns the same pair `POST /auth/login` does, so clients hold one session. */
  async login(
    provider: string,
    code: string,
    codeVerifier: string,
  ): Promise<JwtTokenResponse> {
    const strategy = this.strategy(provider);
    const profile = await strategy.profile(code, codeVerifier);
    const user = await this.resolve(strategy.name, profile);

    this.logger.log(
      `Social sign-in succeeded for user ${user.id} via ${strategy.name}`,
    );

    return this.authService.issueTokensFor(user);
  }

  /** Email is the only join key; a provider is never a second identity path. */
  private async resolve(
    provider: string,
    profile: OAuthProfile,
  ): Promise<User> {
    if (!profile.emailVerified) {
      this.logger.warn(`${provider} asserted an unverified email address`);
      throw new UnauthorizedException();
    }

    const email = profile.email.trim().toLowerCase();
    const separator = email.lastIndexOf('@');
    const domain = separator === -1 ? '' : email.slice(separator + 1);

    const allowedDomains =
      this.config.get<string[]>('services.allowedDomains') ?? [];
    if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
      this.logger.warn(
        `Social sign-in rejected for domain "${domain}" via ${provider}`,
      );
      throw new ForbiddenException(UNPROVISIONED_MESSAGE);
    }

    const user = await this.userRepository.findOne({ email });
    if (!user) {
      this.logger.warn(
        `Social sign-in rejected: no account for the asserted address via ${provider}`,
      );
      throw new ForbiddenException(UNPROVISIONED_MESSAGE);
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    // Only fill what is unset: both fields are editable locally, so syncing
    // them every sign-in would undo corrections.
    let changed = false;

    if (!user.avatar && profile.avatar) {
      user.avatar = profile.avatar;
      changed = true;
    }

    const providerName = profile.name?.trim();
    if (!user.username && providerName) {
      // `username` is unique and provider display names are not, so claim it
      // only when free instead of failing the sign-in on a constraint.
      const owner = await this.userRepository.findOne({
        username: providerName,
      });
      if (!owner || owner.id === user.id) {
        user.username = providerName;
        changed = true;
      } else {
        this.logger.warn(
          `Left username unset for user ${user.id}: "${providerName}" is already taken`,
        );
      }
    }

    if (changed) {
      await this.em.flush();
    }

    return user;
  }
}
