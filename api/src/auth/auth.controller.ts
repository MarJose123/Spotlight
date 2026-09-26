/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import { OAuthService } from '@/auth/oauth.service';
import { OAuthAuthorizeQueryDto } from '@/auth/dto/oauth-authorize-query.dto';
import { OAuthAuthorizeUrlResponseDto } from '@/auth/dto/oauth-authorize-url-response.dto';
import { OAuthExchangeDto } from '@/auth/dto/oauth-exchange.dto';
import { JwtTokenResponse } from '@/auth/dto/jwt-token-response.dto';
import {
  ApiSsoAuthorizeUrl,
  ApiSsoExchange,
  ApiSsoProviders,
} from '@/auth/decorators/sso-api.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @ApiSsoProviders()
  @Get('providers')
  getProviders(): string[] {
    return this.oauthService.enabledProviders();
  }

  @ApiSsoAuthorizeUrl()
  @Get(':provider/authorize-url')
  getAuthorizeUrl(
    @Param('provider') provider: string,
    @Query() query: OAuthAuthorizeQueryDto,
  ): OAuthAuthorizeUrlResponseDto {
    return {
      url: this.oauthService.authorizeUrl(provider, {
        codeChallenge: query.code_challenge,
        state: query.state,
      }),
    };
  }

  @ApiSsoExchange()
  @Throttle({ default: { limit: 10, blockDuration: minutes(5) } })
  @Post(':provider/exchange')
  exchange(
    @Param('provider') provider: string,
    @Body() dto: OAuthExchangeDto,
  ): Promise<JwtTokenResponse> {
    return this.oauthService.login(provider, dto.code, dto.code_verifier);
  }
}
