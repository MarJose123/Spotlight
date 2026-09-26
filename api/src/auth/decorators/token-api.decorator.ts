/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Header, HttpCode, HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CredentialLoginDto } from '@/auth/dto/credential-login.dto';
import { JwtTokenResponse } from '@/auth/dto/jwt-token-response.dto';
import { RefreshTokenDto } from '@/auth/dto/refresh-token.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiAuthenticated } from '@/common/decorators/api-authenticated.decorator';

/**
 * OpenAPI documentation for the token lifecycle endpoints. These also set the
 * response status and caching, since every response here carries credentials.
 */
export const ApiLogin = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Login',
      description:
        'Exchange an email and password for an access/refresh token pair.',
    }),
    ApiBody({ type: CredentialLoginDto }),
    ApiOkResponse({
      description: 'Login successful.',
      type: JwtTokenResponse,
    }),
    ApiUnauthorizedResponse({
      description: 'The supplied credentials are invalid.',
      type: ErrorResponseDto,
    }),
    ApiTooManyRequestsResponse({
      description: 'Too many login attempts.',
      type: ErrorResponseDto,
    }),
    HttpCode(HttpStatus.OK),
    Header('Cache-Control', 'no-store'),
  );

export const ApiLogout = () =>
  applyDecorators(
    ApiAuthenticated(),
    ApiOperation({
      summary: 'Logout',
      description:
        'Revoke the supplied refresh token for the authenticated user.',
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiNoContentResponse({ description: 'Logged out successfully.' }),
    HttpCode(HttpStatus.NO_CONTENT),
  );

export const ApiRefresh = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Refresh token',
      description: 'Exchange a valid refresh token for a fresh access token.',
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiOkResponse({
      description: 'Access token refreshed.',
      type: JwtTokenResponse,
    }),
    ApiUnauthorizedResponse({
      description: 'The refresh token is missing, expired or revoked.',
      type: ErrorResponseDto,
    }),
    HttpCode(HttpStatus.OK),
    Header('Cache-Control', 'no-store'),
  );
