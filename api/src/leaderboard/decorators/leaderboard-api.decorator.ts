/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaderboardEntryDto } from '#/leaderboard/dto/leaderboard-entry.dto.js';
import { ApiAuthenticated } from '#/common/decorators/api-authenticated.decorator.js';

export const ApiLeaderboardController = () =>
  applyDecorators(ApiTags('Leaderboard'), ApiAuthenticated());

export const ApiGetLeaderboard = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get the current month leaderboard' }),
    ApiOkResponse({
      description: 'Ranked list of users by accumulated likes.',
      type: [LeaderboardEntryDto],
    }),
  );
