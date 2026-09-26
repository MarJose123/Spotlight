/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  OAuthAuthorizeParams,
  OAuthProfile,
  OAuthStrategy,
} from '@/auth/interface/oauth.interface';
import type { ZohoServiceConfig } from '@/config/services.config';

interface ZohoTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  /** Zoho reports failures as HTTP 200 with this field, not a 4xx status. */
  error?: string;
}

interface ZohoUserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

/**
 * Deliberately not a `PassportStrategy`: those own the browser redirect and
 * keep the PKCE verifier in a server-side store, which is the state this
 * design avoids.
 */
@Injectable()
export class ZohoStrategy implements OAuthStrategy {
  readonly name = 'zoho';

  private readonly logger = new Logger(ZohoStrategy.name);

  private static readonly TIMEOUT_MS = 10_000;

  constructor(private readonly config: ConfigService) {}

  private get zoho(): ZohoServiceConfig {
    return this.config.getOrThrow<ZohoServiceConfig>('services.zoho');
  }

  isEnabled(): boolean {
    return this.zoho.enabled;
  }

  authorizeUrl({ codeChallenge, state }: OAuthAuthorizeParams): string {
    if (!this.isEnabled()) {
      throw new NotFoundException();
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.require('clientId'),
      redirect_uri: this.require('callbackUrl'),
      scope: this.zoho.scope.join(' '),
      // Online, not offline: we never store a Zoho refresh token.
      access_type: 'online',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.zoho.accountServer}/oauth/v2/auth?${params.toString()}`;
  }

  async profile(code: string, codeVerifier: string): Promise<OAuthProfile> {
    if (!this.isEnabled()) {
      throw new NotFoundException();
    }

    return this.fetchProfile(await this.exchangeCode(code, codeVerifier));
  }

  private async exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.require('clientId'),
      client_secret: this.require('clientSecret'),
      redirect_uri: this.require('callbackUrl'),
      code_verifier: codeVerifier,
    });

    const response = await this.request(
      `${this.zoho.accountServer}/oauth/v2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body,
      },
    );

    const payload = (await this.readJson(response)) as ZohoTokenResponse;

    if (!response.ok || payload.error || !payload.access_token) {
      // Log the reason but never echo it: the wording tells a prober whether a
      // code was replayed or the verifier was wrong.
      this.logger.warn(
        `Zoho token exchange rejected (${response.status}): ${
          payload.error ?? 'no access_token in response'
        }`,
      );
      throw new UnauthorizedException();
    }

    return payload.access_token;
  }

  private async fetchProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await this.request(
      `${this.zoho.accountServer}/oauth/v2/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      this.logger.warn(`Zoho userinfo failed with ${response.status}`);
      throw new UnauthorizedException();
    }

    const payload = (await this.readJson(response)) as ZohoUserInfoResponse;

    if (!payload.sub || !payload.email) {
      this.logger.warn('Zoho userinfo returned no subject or email');
      throw new UnauthorizedException();
    }

    return {
      email: String(payload.email),
      // An absent claim must not read as verified, or an unverified address
      // could take over a provisioned account.
      emailVerified: payload.email_verified === true,
      name: payload.name ?? this.combineName(payload),
      avatar: payload.picture,
    };
  }

  private combineName(payload: ZohoUserInfoResponse): string | undefined {
    const parts = [payload.given_name, payload.family_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(ZohoStrategy.TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error(
        `Zoho request to ${url} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new UnauthorizedException();
    }
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      this.logger.warn('Zoho returned a non-JSON response');
      throw new UnauthorizedException();
    }
  }

  private require(key: keyof ZohoServiceConfig): string {
    const value = this.zoho[key];
    if (typeof value !== 'string' || value.length === 0) {
      throw new InternalServerErrorException(
        `Missing configuration: services.zoho.${key}`,
      );
    }
    return value;
  }
}
