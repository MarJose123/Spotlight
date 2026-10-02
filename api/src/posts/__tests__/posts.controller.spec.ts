/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PostsController } from '@/posts/posts.controller';
import { PostsService } from '@/posts/posts.service';
import { BucketService } from '@/bucket/bucket.service';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;
  let bucketService: BucketService;

  const mockPostsService = () => ({
    findAll: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    likePost: vi.fn(),
  });

  const mockBucketService = () => ({
    generatePresignedUploadUrl: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    postsService = mockPostsService() as unknown as PostsService;
    bucketService = mockBucketService() as unknown as BucketService;
    controller = new PostsController(postsService, bucketService);
  });

  describe('getPosts', () => {
    it('should return paginated posts', async () => {
      const paginationResult = {
        data: [{ id: 'a' }, { id: 'b' }],
        meta: { total: 2, currentPage: 1, perPage: 10, totalPages: 1 },
      };
      vi.mocked(postsService.findAll).mockResolvedValue(paginationResult);

      const result = await controller.getPosts({ page: 1, limit: 10 });

      expect(result).toBe(paginationResult);
      expect(postsService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('getPostsByUser', () => {
    it('should return posts filtered by user id', async () => {
      const paginationResult = {
        data: [{ id: 'a' }],
        meta: { total: 1, currentPage: 1, perPage: 10, totalPages: 1 },
      };
      vi.mocked(postsService.findByUserId).mockResolvedValue(paginationResult);

      const result = await controller.getPostsByUser({ page: 1, limit: 10 }, 'user-123');

      expect(result).toBe(paginationResult);
      expect(postsService.findByUserId).toHaveBeenCalledWith({
        paginationQuery: { page: 1, limit: 10 },
        userId: 'user-123',
      });
    });
  });

  describe('createPost', () => {
    it('should create a post', async () => {
      const dto = {
        content: 'Thanks!',
        attachmentType: 'IMAGE',
        attachment: ['https://example.com/img.png'],
        postType: 'USER',
        user: 'user-123',
      };
      const created = { id: 'new-post', content: 'Thanks!' };
      vi.mocked(postsService.create).mockResolvedValue(created);

      const result = await controller.createPost(dto);

      expect(result).toBe(created);
      expect(postsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('likePost', () => {
    it('should toggle like via PUT /like', async () => {
      const dto = { postId: 'post-123', userId: 'user-456' };
      const result = { like: true, likesCount: 1 };
      vi.mocked(postsService.likePost).mockResolvedValue(result);

      const response = await controller.likePost(dto);

      expect(response).toBe(result);
      expect(postsService.likePost).toHaveBeenCalledWith(dto);
    });
  });

  describe('likePostById', () => {
    it('should toggle like via POST /:id/like', async () => {
      const result = { like: false, likesCount: 0 };
      vi.mocked(postsService.likePost).mockResolvedValue(result);

      const response = await controller.likePostById('post-123', 'user-456');

      expect(response).toBe(result);
      expect(postsService.likePost).toHaveBeenCalledWith({ postId: 'post-123', userId: 'user-456' });
    });

    it('should propagate NotFoundException when liking unknown post', async () => {
      vi.mocked(postsService.likePost).mockRejectedValue(new NotFoundException());

      await expect(controller.likePostById('missing', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadPhotos', () => {
    it('should return a presigned upload URL', async () => {
      const dto = { key: 'uploads/img.png', contentType: 'image/png', fileSize: 1024, filename: 'img.png' };
      const presigned = { url: 'https://s3.example.com/upload', path: 'uploads/img.png' };
      vi.mocked(bucketService.generatePresignedUploadUrl).mockResolvedValue(presigned);

      const result = await controller.uploadPhotos(dto);

      expect(result).toBe(presigned);
      expect(bucketService.generatePresignedUploadUrl).toHaveBeenCalledWith(dto);
    });
  });
});
