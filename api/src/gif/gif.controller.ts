/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '#/auth/guard/auth.guard.js';
import { ApiAuthenticated } from '#/common/decorators/api-authenticated.decorator.js';
import { PaginationQueryDto } from '#/common/dto/pagination/pagination-query.dto.js';
import {
  ApiSearchGifs,
  ApiTrendingGifs,
} from '#/gif/decorators/gif-api.decorator.js';
import { GifService } from '#/gif/gif.service.js';
import { SearchGifQueryDto } from '#/gif/dto/search-gif-query.dto.js';

@ApiTags('GIFs')
@ApiAuthenticated()
@Controller('gifs')
@UseGuards(Auth)
export class GifController {
  constructor(private readonly gifService: GifService) {}

  @ApiSearchGifs()
  @Get()
  async searchGifs(@Query() queryDto: SearchGifQueryDto) {
    return this.gifService.searchGifs(queryDto);
  }

  @ApiTrendingGifs()
  @Get('trending')
  async getTrendingGifs(@Query() paginationQuery: PaginationQueryDto) {
    return this.gifService.getTrendingGifs(paginationQuery);
  }
}
