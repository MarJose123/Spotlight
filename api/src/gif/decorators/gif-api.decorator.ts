/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { SearchGifResponseDto } from '#/gif/dto/gif-response.dto.js';
import { ErrorResponseDto } from '#/common/dto/error-response.dto.js';
import { ApiPaginatedResponse } from '#/common/decorators/api-paginated-response.decorator.js';
import { GifUrlDto } from '#/gif/dto/gif-response.dto.js';

export const ApiSearchGifs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Search GIFs',
      description:
        'Search Giphy for GIFs matching the given query term and return their URLs.',
    }),
    ApiQuery({
      name: 'query',
      required: true,
      description: 'Search term for finding GIFs.',
      example: 'celebration',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Maximum number of results (1-50, default 10).',
      example: 10,
    }),
    ApiOkResponse({
      description: 'List of matching GIFs.',
      type: SearchGifResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid query parameters.',
      type: ErrorResponseDto,
    }),
  );

export const ApiTrendingGifs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get trending GIFs',
      description:
        'Return trending GIFs from Giphy with pagination support (up to 100 per page).',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number (1-based).',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of results per page (1-100, default 10).',
      example: 10,
    }),
    ApiPaginatedResponse(GifUrlDto, 'Paginated list of trending GIFs.'),
    ApiBadRequestResponse({
      description: 'Invalid pagination parameters.',
      type: ErrorResponseDto,
    }),
  );
