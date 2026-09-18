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
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { CredentialLoginDto } from './auth/dto/credential-login.dto';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
export class AppController {
  constructor(private authService: AuthService) {}

  @ApiOkResponse({ description: 'Login successful' })
  @ApiBody({ type: CredentialLoginDto })
  @ApiOperation({
    summary: 'Login',
    description: 'Login with email and password',
  })
  @HttpCode(200)
  @Throttle({ default: { limit: 3, blockDuration: minutes(5) } })
  @Post('login')
  async login(@Body() dto: CredentialLoginDto) {
    const user = await this.authService.validateUserEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        message: 'The email address does not exist in the system.',
      });
    }

    return await this.authService.authenticate(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout the user',
  })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @HttpCode(204)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body('refresh_token') refreshToken: string) {
    await this.authService.logout(refreshToken);

    return { message: 'Logged out successfully' };
  }

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refresh the access token',
  })
  @ApiResponse({ status: 200, description: 'Access token refreshed' })
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body('refresh_token') refreshToken: string) {
    return await this.authService.refresh(refreshToken);
  }
}
