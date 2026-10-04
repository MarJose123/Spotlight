/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GifController } from '#/gif/gif.controller.js';
import { GifService } from '#/gif/gif.service.js';

describe('GifController', () => {
  let controller: GifController;
  let gifService: GifService;

  const mockGifService = () => ({
    searchGifs: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    gifService = mockGifService() as unknown as GifService;
    controller = new GifController(gifService);
  });

  describe('searchGifs', () => {
    it('should return GIFs for a valid query', async () => {
      const mockResult = {
        data: [
          {
            url: 'https://media.giphy.com/media/abc123/giphy.gif',
            id: 'abc123',
            title: 'Happy Dance',
          },
        ],
      };
      vi.mocked(gifService.searchGifs).mockResolvedValue(mockResult);

      const result = await controller.searchGifs({ query: 'celebration' });

      expect(result).toBe(mockResult);
      expect(gifService.searchGifs).toHaveBeenCalledWith({
        query: 'celebration',
      });
    });

    it('should pass limit parameter to service', async () => {
      const mockResult = { data: [] };
      vi.mocked(gifService.searchGifs).mockResolvedValue(mockResult);

      await controller.searchGifs({ query: 'dance', limit: '5' });

      expect(gifService.searchGifs).toHaveBeenCalledWith({
        query: 'dance',
        limit: '5',
      });
    });
  });
});
