/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { GifService } from '#/gif/gif.service.js';

describe('GifService', () => {
  let service: GifService;
  let configService: any;

  const mockConfigService = (apiKey = 'test-api-key') => ({
    get: vi.fn().mockReturnValue(apiKey),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw when API key is not configured', () => {
      const emptyConfigService = {
        get: vi.fn().mockReturnValue(undefined),
      };

      expect(() => {
        new GifService(emptyConfigService as any);
      }).toThrow(UnauthorizedException);
    });
  });

  describe('searchGifs', () => {
    const mockGiphyResponse = {
      data: [
        {
          id: 'abc123',
          title: 'Happy Dance',
          images: {
            fixed_height: {
              url: 'https://media.giphy.com/media/abc123/giphy.gif',
            },
          },
        },
        {
          id: 'def456',
          title: 'Celebration',
          images: {
            fixed_height: {
              url: 'https://media.giphy.com/media/def456/giphy.gif',
            },
          },
        },
      ],
      meta: {
        status: 200,
        msg: 'OK',
      },
    };

    beforeEach(() => {
      configService = mockConfigService('test-api-key');
      service = new GifService(configService);
    });

    it('should return GIFs for a valid query', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGiphyResponse),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await service.searchGifs({ query: 'celebration' });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].url).toBe(
        'https://media.giphy.com/media/abc123/giphy.gif',
      );
      expect(result.data[0].id).toBe('abc123');
      expect(result.data[0].title).toBe('Happy Dance');
      expect(mockFetch).toHaveBeenCalledOnce();
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('api_key=test-api-key');
      expect(calledUrl).toContain('q=celebration');
      expect(calledUrl).toContain('limit=10');
    });

    it('should respect the limit parameter', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGiphyResponse),
      });
      vi.stubGlobal('fetch', mockFetch);

      await service.searchGifs({ query: 'dance', limit: '5' });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('limit=5');
    });

    it('should cap limit at 50', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGiphyResponse),
      });
      vi.stubGlobal('fetch', mockFetch);

      await service.searchGifs({ query: 'dance', limit: '100' });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('limit=50');
    });

    it('should throw when Giphy API returns non-ok response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(service.searchGifs({ query: 'test' })).rejects.toThrow(
        'Failed to fetch GIFs from Giphy.',
      );
    });

    it('should throw when Giphy API returns error status', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [],
            meta: { status: 403, msg: 'API key invalid' },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(service.searchGifs({ query: 'test' })).rejects.toThrow(
        'Giphy API returned an error.',
      );
    });

    it('should return empty array when no GIFs match', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [],
            meta: { status: 200, msg: 'OK' },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await service.searchGifs({ query: 'nonexistent' });

      expect(result.data).toEqual([]);
    });
  });

  describe('getTrendingGifs', () => {
    const mockGiphyTrendingResponse = {
      data: [
        {
          id: 'trending1',
          title: 'Trending GIF 1',
          images: {
            fixed_height: {
              url: 'https://media.giphy.com/media/trending1/giphy.gif',
            },
          },
        },
        {
          id: 'trending2',
          title: 'Trending GIF 2',
          images: {
            fixed_height: {
              url: 'https://media.giphy.com/media/trending2/giphy.gif',
            },
          },
        },
      ],
      meta: {
        status: 200,
        msg: 'OK',
      },
    };

    beforeEach(() => {
      configService = mockConfigService('test-api-key');
      service = new GifService(configService);
    });

    it('should return trending GIFs with default pagination', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGiphyTrendingResponse),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await service.getTrendingGifs({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.data![0].url).toBe(
        'https://media.giphy.com/media/trending1/giphy.gif',
      );
      expect(result.data![0].id).toBe('trending1');
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.perPage).toBe(10);
      expect(result.meta.itemCount).toBe(2);
      expect(mockFetch).toHaveBeenCalledOnce();
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('api_key=test-api-key');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('offset=0');
    });

    it('should calculate offset for page 2', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGiphyTrendingResponse),
      });
      vi.stubGlobal('fetch', mockFetch);

      await service.getTrendingGifs({ page: 2, limit: 10 });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('offset=10');
    });

    it('should cap limit at 100', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGiphyTrendingResponse),
      });
      vi.stubGlobal('fetch', mockFetch);

      await service.getTrendingGifs({ page: 1, limit: 200 });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('limit=100');
    });

    it('should throw when Giphy API returns non-ok response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        service.getTrendingGifs({ page: 1, limit: 10 }),
      ).rejects.toThrow('Failed to fetch trending GIFs from Giphy.');
    });

    it('should throw when Giphy API returns error status', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [],
            meta: { status: 403, msg: 'API key invalid' },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        service.getTrendingGifs({ page: 1, limit: 10 }),
      ).rejects.toThrow('Giphy API returned an error.');
    });

    it('should return empty array when no trending GIFs', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [],
            meta: { status: 200, msg: 'OK' },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await service.getTrendingGifs({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.itemCount).toBe(0);
    });
  });
});
