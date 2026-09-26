/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Header, HttpCode, HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { OAuthAuthorizeUrlResponseDto } from '@/auth/dto/oauth-authorize-url-response.dto';
import { JwtTokenResponse } from '@/auth/dto/jwt-token-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

/**
 * OpenAPI documentation for the social sign-in endpoints, composed so the
 * controller shows one decorator per route instead of a wall of `@Api*` calls.
 *
 * These also set the response status and caching: both are part of the contract
 * being documented, and every endpoint here returns credentials that must not
 * be cached. Routing (`@Get`/`@Post`) and throttling stay on the method so the
 * route and its limits remain readable at a glance.
 */
const providerParam = () =>
  ApiParam({
    name: 'provider',
    description: 'Provider key, as returned by `GET /auth/providers`.',
    example: 'zoho',
  });

const noStore = () => Header('Cache-Control', 'no-store');

export const ApiSsoProviders = () =>
  applyDecorators(
    ApiOperation({
      summary: 'SSO Providers',
      description:
        'Social sign-in providers this deployment can offer. Providers without credentials are omitted.',
    }),
    ApiOkResponse({
      description: 'Names of the enabled providers.',
      schema: { type: 'array', items: { type: 'string' }, example: ['zoho'] },
    }),
    HttpCode(HttpStatus.OK),
  );

export const ApiSsoAuthorizeUrl = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Authorization URL',
      description:
        'Builds the provider URL to navigate to. The client generates the PKCE verifier and the state, keeps both, and sends only the challenge and the state here.',
    }),
    providerParam(),
    ApiOkResponse({ type: OAuthAuthorizeUrlResponseDto }),
    noStore(),
  );

export const ApiSsoExchange = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Exchange authorization code',
      description:
        'Redeems the provider authorization code for a Spotlight access/refresh pair. The provider’s own tokens are discarded. The response is identical to `POST /auth/login`.',
    }),
    providerParam(),
    ApiOkResponse({
      description: 'Sign-in successful.',
      type: JwtTokenResponse,
    }),
    ApiUnauthorizedResponse({
      description: 'The code, verifier or provider assertion was rejected.',
      type: ErrorResponseDto,
    }),
    ApiTooManyRequestsResponse({
      description: 'Too many exchange attempts.',
      type: ErrorResponseDto,
    }),
    noStore(),
    HttpCode(HttpStatus.OK),
  );
