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
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeaderboardService } from '#/leaderboard/leaderboard.service.js';
import { Auth } from '#/auth/guard/auth.guard.js';
import { RolesGuard } from '#/auth/guard/roles.guard.js';
import { Roles } from '#/auth/decorators/roles.decorator.js';
import { UserRole } from '#/users/enums/role.enum.js';
import type { AuthenticatedRequest } from '#/auth/interface/payload.interface.js';
import {
  ApiGetLeaderboard,
  ApiLeaderboardController,
} from '#/leaderboard/decorators/leaderboard-api.decorator.js';
import { PaginationQueryDto } from '#/common/dto/pagination/pagination-query.dto.js';
import { PaginationResponseDto } from '#/common/dto/pagination/pagination-response.dto.js';

@ApiLeaderboardController()
@Controller('leaderboard')
@UseGuards(Auth, RolesGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiGetLeaderboard()
  getLeaderboard() {
    return this.leaderboardService.getLeaderboard();
  }

  @Get('me')
  getUserPoints(@Req() req: AuthenticatedRequest) {
    return this.leaderboardService.getUserPoints(req.auth.sub);
  }

  @Get('settings')
  @Roles(UserRole.ADMIN)
  getSettings() {
    return this.leaderboardService.getSettings();
  }

  @Put('settings/:key')
  @Roles(UserRole.ADMIN)
  updateSetting(@Param('key') key: string, @Body('value') value: string) {
    return this.leaderboardService.updateSetting(key, value);
  }

  @Get('settings/users')
  @Roles(UserRole.ADMIN)
  getUsersWithBudgets(@Query() paginationQuery: PaginationQueryDto): Promise<
    PaginationResponseDto<{
      user: { id: string; name: string; email: string };
      customBudget: number | null;
      resolvedBudget: number;
    }>
  > {
    return this.leaderboardService.getUsersWithBudgets(paginationQuery);
  }

  @Put('settings/users/:userId/budget')
  @Roles(UserRole.ADMIN)
  setUserBudget(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body('customBudget') customBudget: number | null,
  ) {
    return this.leaderboardService.setUserBudget(userId, customBudget);
  }
}
