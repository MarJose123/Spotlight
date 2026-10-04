/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PostsController } from '#/posts/posts.controller.js';
import { PostsService } from '#/posts/posts.service.js';
import { BucketService } from '#/bucket/bucket.service.js';
import { PaginationResponseDto } from '#/common/dto/pagination/pagination-response.dto.js';
import { PostResponseDto } from '#/posts/dto/post-response.dto.js';
import { AttachmentType } from '#/posts/enums/attachment-type.enum.js';
import { PostType } from '#/posts/enums/post-type.enum.js';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;
  let bucketService: BucketService;

  const makePostResponse = (overrides = {}): PostResponseDto => ({
    id: 'post-123',
    userId: 'user-123',
    content: 'Great work!',
    attachmentType: AttachmentType.IMAGE,
    attachment: ['https://example.com/img.png'],
    postType: PostType.USER,
    likedBy: undefined,
    likesCount: 0,
    createdAt: new Date(),
    ...overrides,
  });

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
      const paginationResult = new PaginationResponseDto(
        [makePostResponse({ id: 'a' }), makePostResponse({ id: 'b' })],
        2,
        1,
        10,
      );
      vi.mocked(postsService.findAll).mockResolvedValue(paginationResult);

      const result = await controller.getPosts({ page: 1, limit: 10 });

      expect(result).toBe(paginationResult);
      expect(postsService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('getPostsByUser', () => {
    it('should return posts filtered by user id', async () => {
      const paginationResult = new PaginationResponseDto(
        [makePostResponse({ id: 'a' })],
        1,
        1,
        10,
      );
      vi.mocked(postsService.findByUserId).mockResolvedValue(paginationResult);

      const result = await controller.getPostsByUser(
        { page: 1, limit: 10 },
        'user-123',
      );

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
        attachmentType: AttachmentType.IMAGE,
        attachment: ['https://example.com/img.png'],
        postType: PostType.USER,
        user: 'user-123',
      };
      const created = makePostResponse({ id: 'new-post', content: 'Thanks!' });
      vi.mocked(postsService.create).mockResolvedValue(created);

      const result = await controller.createPost(dto);

      expect(result).toBe(created);
      expect(postsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('likePost', () => {
    it('should toggle like via PUT /like', async () => {
      const dto = { postId: 'post-123', userId: 'user-456' };
      const result = { like: true, post: makePostResponse({ likesCount: 1 }) };
      vi.mocked(postsService.likePost).mockResolvedValue(result);

      const response = await controller.likePost(dto);

      expect(response).toBe(result);
      expect(postsService.likePost).toHaveBeenCalledWith(dto);
    });
  });

  describe('likePostById', () => {
    it('should toggle like via POST /:id/like', async () => {
      const result = { like: false, post: makePostResponse() };
      vi.mocked(postsService.likePost).mockResolvedValue(result);

      const response = await controller.likePostById('post-123', 'user-456');

      expect(response).toBe(result);
      expect(postsService.likePost).toHaveBeenCalledWith({
        postId: 'post-123',
        userId: 'user-456',
      });
    });

    it('should propagate NotFoundException when liking unknown post', async () => {
      vi.mocked(postsService.likePost).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        controller.likePostById('missing', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadPhotos', () => {
    it('should return a presigned upload URL', async () => {
      const dto = {
        key: 'uploads/img.png',
        contentType: 'image/png',
        fileSize: 1024,
        filename: 'img.png',
      };
      const presigned = {
        url: 'https://s3.example.com/upload',
        path: 'uploads/img.png',
      };
      vi.mocked(bucketService.generatePresignedUploadUrl).mockResolvedValue(
        presigned,
      );

      const result = await controller.uploadPhotos(dto);

      expect(result).toBe(presigned);
      expect(bucketService.generatePresignedUploadUrl).toHaveBeenCalledWith(
        dto,
      );
    });
  });
});
