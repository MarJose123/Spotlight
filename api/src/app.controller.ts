/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth/auth.service';
import { CredentialLoginDto } from './auth/dto/credential-login.dto';
import { RefreshTokenDto } from './auth/dto/refresh-token.dto';
import { JwtTokenResponse } from './auth/dto/jwt-token-response.dto';
import { ErrorResponseDto } from './common/dto/error-response.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import { Auth } from '@/auth/guard/auth.guard';
import type { AuthenticatedRequest } from '@/auth/interface/payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AppController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: 'Login',
    description:
      'Exchange an email and password for an access/refresh token pair.',
  })
  @ApiBody({ type: CredentialLoginDto })
  @ApiOkResponse({
    description: 'Login successful.',
    type: JwtTokenResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'The supplied credentials are invalid.',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many login attempts.',
    type: ErrorResponseDto,
  })
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 3, blockDuration: minutes(5) } })
  @Post('login')
  async login(@Body() dto: CredentialLoginDto) {
    const user = await this.authService.validateUserEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({ message: INVALID_CREDENTIALS_MESSAGE });
    }

    return await this.authService.authenticate(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description:
      'Revoke the supplied refresh token for the authenticated user.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiNoContentResponse({ description: 'Logged out successfully.' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token.',
    type: ErrorResponseDto,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @UseGuards(Auth)
  async logout(
    @Body('refresh_token') refreshToken: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException();
    }

    await this.authService.logout(refreshToken, userId);
  }

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Exchange a valid refresh token for a fresh access token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    description: 'Access token refreshed.',
    type: JwtTokenResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'The refresh token is missing, expired or revoked.',
    type: ErrorResponseDto,
  })
  @Post('refresh')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return await this.authService.refresh(refreshToken);
  }
}
