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
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth/auth.service';
import { CredentialLoginDto } from './auth/dto/credential-login.dto';
import { Auth } from '@/auth/guard/auth.guard';
import type { AuthenticatedRequest } from '@/auth/interface/payload.interface';
import {
  ApiLogin,
  ApiLogout,
  ApiRefresh,
} from '@/auth/decorators/token-api.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AppController {
  constructor(private authService: AuthService) {}

  @ApiLogin()
  @Throttle({ default: { limit: 3, blockDuration: minutes(5) } })
  @Post('login')
  async login(@Body() dto: CredentialLoginDto) {
    const user = await this.authService.validateUserEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({ message: INVALID_CREDENTIALS_MESSAGE });
    }

    return await this.authService.authenticate(dto);
  }

  @ApiLogout()
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

  @ApiRefresh()
  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return await this.authService.refresh(refreshToken);
  }
}
