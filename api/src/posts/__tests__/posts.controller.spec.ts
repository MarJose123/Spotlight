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
import { CommentsService } from '#/posts/comments.service.js';
import { PaginationResponseDto } from '#/common/dto/pagination/pagination-response.dto.js';
import { PostResponseDto } from '#/posts/dto/post-response.dto.js';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';
import { PostType } from '#/posts/enums/post-type.enum.js';
import type { FastifyMultipartFile } from '#/common/interceptors/multipart-file.interceptor.js';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;

  const makePostResponse = (overrides = {}): PostResponseDto => ({
    id: 'post-123',
    author: {
      id: 'user-123',
      name: 'Test User',
      username: undefined,
      avatarUrl: undefined,
    },
    content: 'Great work!',
    attachments: [
      { url: 'https://example.com/img.png', type: AttachmentType.IMAGE },
    ],
    postType: PostType.USER,
    likedBy: undefined,
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date(),
    ...overrides,
  });

  const mockPostsService = () => ({
    findAll: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    likePost: vi.fn(),
  });

  const mockCommentsService = () => ({
    create: vi.fn(),
    findByPost: vi.fn(),
  });

  let commentsService: CommentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    postsService = mockPostsService() as unknown as PostsService;
    commentsService = mockCommentsService() as unknown as CommentsService;
    controller = new PostsController(postsService, commentsService);
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
    it('should create a post with files and a single attachment type', async () => {
      const dto = {
        content: 'Thanks!',
        postType: PostType.USER,
        user: 'user-123',
        attachmentType: AttachmentType.IMAGE,
      };
      const files = [
        {
          fieldname: 'file',
          filename: 'img.png',
          mimetype: 'image/png',
          encoding: '7bit',
          buffer: Buffer.from('test'),
        },
      ];
      const created = makePostResponse({ id: 'new-post', content: 'Thanks!' });
      vi.mocked(postsService.create).mockResolvedValue(created);

      const mockReq = { auth: { sub: 'user-123', user: {} } } as any;
      const result = await controller.createPost(mockReq, dto, files);

      expect(result).toBe(created);
      expect(postsService.create).toHaveBeenCalledWith(dto, 'user-123', files);
    });

    it('should create a GIF post with a URL and no files', async () => {
      const dto = {
        content: 'Funny GIF',
        postType: PostType.USER,
        user: 'user-123',
        attachmentType: AttachmentType.GIF,
        gifUrl: 'https://media.giphy.com/media/abc123/giphy.gif',
      };
      const files: FastifyMultipartFile[] = [];
      const created = makePostResponse({
        id: 'new-post',
        content: 'Funny GIF',
        attachments: [
          {
            url: 'https://media.giphy.com/media/abc123/giphy.gif',
            type: AttachmentType.GIF,
          },
        ],
      });
      vi.mocked(postsService.create).mockResolvedValue(created);

      const mockReq = { auth: { sub: 'user-123', user: {} } } as any;
      const result = await controller.createPost(mockReq, dto, files);

      expect(result).toBe(created);
      expect(postsService.create).toHaveBeenCalledWith(dto, 'user-123', files);
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
});
