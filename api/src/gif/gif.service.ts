/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaginationQueryDto } from '#/common/dto/pagination/pagination-query.dto.js';
import { PaginationResponseDto } from '#/common/dto/pagination/pagination-response.dto.js';
import { SearchGifQueryDto } from '#/gif/dto/search-gif-query.dto.js';
import { GifUrlDto, SearchGifResponseDto } from '#/gif/dto/gif-response.dto.js';

interface GiphySearchResult {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
    };
  };
}

interface GiphyApiResponse {
  data: GiphySearchResult[];
  meta: {
    status: number;
    msg: string;
  };
}

@Injectable()
export class GifService {
  private readonly logger = new Logger(GifService.name);
  private readonly apiKey: string;
  private readonly searchUrl = 'https://api.giphy.com/v1/gifs/search';
  private readonly trendingUrl = 'https://api.giphy.com/v1/gifs/trending';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('giphy.apiKey') ?? '';
    if (!this.apiKey) {
      throw new UnauthorizedException('Giphy API key is not configured.');
    }
    this.logger.log(`Giphy API key configured: ${this.apiKey.slice(0, 4)}***`);
  }

  async searchGifs(queryDto: SearchGifQueryDto): Promise<SearchGifResponseDto> {
    const limit = Math.min(parseInt(queryDto.limit ?? '10', 10), 50);
    const url = new URL(this.searchUrl);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('q', queryDto.query);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString());

    if (!response.ok) {
      this.logger.error(
        `Giphy API returned ${response.status}: ${response.statusText}`,
      );
      throw new Error('Failed to fetch GIFs from Giphy.');
    }

    const json: GiphyApiResponse = await response.json();

    if (json.meta.status !== 200) {
      this.logger.error(`Giphy API error: ${json.meta.msg}`);
      throw new Error('Giphy API returned an error.');
    }

    const data: GifUrlDto[] = json.data.map((result: GiphySearchResult) => ({
      url: result.images.fixed_height.url,
      id: result.id,
      title: result.title,
    }));

    return { data };
  }

  async getTrendingGifs(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<GifUrlDto>> {
    const { page, limit } = paginationQuery;
    const cappedLimit = Math.min(limit, 100); // Giphy max is 100
    const offset = (page - 1) * cappedLimit;

    const url = new URL(this.trendingUrl);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('limit', String(cappedLimit));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url.toString());

    if (!response.ok) {
      this.logger.error(
        `Giphy API returned ${response.status}: ${response.statusText}`,
      );
      throw new Error('Failed to fetch trending GIFs from Giphy.');
    }

    const json: GiphyApiResponse = await response.json();

    if (json.meta.status !== 200) {
      this.logger.error(`Giphy API error: ${json.meta.msg}`);
      throw new Error('Giphy API returned an error.');
    }

    const data: GifUrlDto[] = json.data.map((result: GiphySearchResult) => ({
      url: result.images.fixed_height.url,
      id: result.id,
      title: result.title,
    }));

    // Giphy doesn't return a total count for trending. If we got a full page,
    // assume there are more results; otherwise we've reached the end.
    const hasMore = data.length === cappedLimit;
    const total = hasMore ? page * cappedLimit + 1 : offset + data.length;

    return new PaginationResponseDto(data, total, page, cappedLimit);
  }
}
