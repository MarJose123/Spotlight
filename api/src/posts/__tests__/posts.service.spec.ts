/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from '#/posts/posts.service.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { Likes } from '#/posts/entities/likes.entity.js';
import { User } from '#/users/entities/user.entity.js';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';
import { PostType } from '#/posts/enums/post-type.enum.js';
import type { BucketService } from '#/bucket/bucket.service.js';
import type { FastifyMultipartFile } from '#/common/interceptors/multipart-file.interceptor.js';

describe('PostsService', () => {
  let service: PostsService;
  let postRepository: any;
  let likesRepository: any;
  let em: any;
  let bucketService: BucketService;

  const makeUser = (id = 'user-123') => {
    const user = new User();
    Object.assign(user, { id });
    return user;
  };

  const makePost = (overrides = {}): Posts => {
    const post = new Posts();
    Object.assign(post, {
      id: 'post-123',
      content: 'Great work!',
      attachments: [{ key: 'posts/img.png', type: AttachmentType.IMAGE }],
      postType: PostType.USER,
      user: makeUser(),
      likes: new (class extends Array {})(),
      likesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
    return post;
  };

  const mockPostRepo = () => ({
    findOne: vi.fn(),
    findOneOrFail: vi.fn(),
    findAndCount: vi.fn(),
    create: vi.fn(),
    nativeDelete: vi.fn(),
  });

  const mockLikesRepo = () => ({
    findOne: vi.fn(),
    create: vi.fn(),
    nativeDelete: vi.fn(),
  });

  const mockEm = () => ({
    flush: vi.fn(() => Promise.resolve()),
    remove: vi.fn(),
    getReference: vi.fn((entity, id) => ({ __entity: entity, __ref: id })),
  });

  const mockBucketService = () => ({
    uploadFile: vi.fn(),
    getTemporaryUrl: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    postRepository = mockPostRepo();
    likesRepository = mockLikesRepo();
    em = mockEm();
    bucketService = mockBucketService() as unknown as BucketService;
    service = new PostsService(
      postRepository,
      likesRepository,
      em,
      bucketService,
    );
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const posts = [makePost({ id: 'a' }), makePost({ id: 'b' })];
      postRepository.findAndCount.mockResolvedValue([posts, 2]);
      vi.mocked(bucketService.getTemporaryUrl).mockResolvedValue(
        'https://example.com/img.png',
      );

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(postRepository.findAndCount).toHaveBeenCalledWith(
        {},
        {
          offset: 0,
          limit: 10,
          orderBy: { createdAt: 'desc', id: 'desc' },
          populate: ['user', 'likes.user'],
        },
      );
    });
  });

  describe('findById', () => {
    it('should return the post when found', async () => {
      const post = makePost();
      postRepository.findOne.mockResolvedValue(post);
      vi.mocked(bucketService.getTemporaryUrl).mockResolvedValue(
        'https://example.com/img.png',
      );

      const result = await service.findById('post-123');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('post-123');
    });

    it('should throw NotFoundException when not found', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return posts filtered by user id', async () => {
      const posts = [makePost({ id: 'a' })];
      postRepository.findAndCount.mockResolvedValue([posts, 1]);
      vi.mocked(bucketService.getTemporaryUrl).mockResolvedValue(
        'https://example.com/img.png',
      );

      const result = await service.findByUserId({
        paginationQuery: { page: 1, limit: 10 },
        userId: 'user-123',
      });

      expect(result.data).toHaveLength(1);
      expect(postRepository.findAndCount).toHaveBeenCalledWith(
        { user: 'user-123' },
        {
          offset: 0,
          limit: 10,
          orderBy: { createdAt: 'desc', id: 'desc' },
          populate: ['user', 'likes.user'],
        },
      );
    });
  });

  describe('create', () => {
    const makeFile = (mimetype = 'image/png') => ({
      fieldname: 'file',
      filename: 'img.png',
      mimetype,
      encoding: '7bit',
      buffer: Buffer.from('test'),
    });

    it('should create and persist a post', async () => {
      const dto = {
        content: 'Thanks!',
        postType: PostType.USER,
        user: 'user-123',
        attachmentType: AttachmentType.IMAGE,
      };
      const files = [makeFile()];
      vi.mocked(bucketService.uploadFile).mockResolvedValue(
        'posts/123-img.png',
      );
      vi.mocked(bucketService.getTemporaryUrl).mockResolvedValue(
        'https://example.com/img.png',
      );
      // After create, the service reloads the post to populate the user.
      postRepository.findOne.mockResolvedValue(
        makePost({ content: 'Thanks!' }),
      );

      const result = await service.create(dto, 'user-123', files);

      expect(bucketService.uploadFile).toHaveBeenCalledTimes(1);
      expect(postRepository.create).toHaveBeenCalled();
      expect(em.flush).toHaveBeenCalled();
      expect(result!.content).toBe('Thanks!');
      expect(result!.attachments[0].url).toBe('https://example.com/img.png');
    });

    it('should reject more than 5 images', async () => {
      const dto = {
        content: 'Too many',
        postType: PostType.USER,
        user: 'user-123',
        attachmentType: AttachmentType.IMAGE,
      };
      const files = Array.from({ length: 6 }, () => makeFile());

      await expect(service.create(dto, 'user-123', files)).rejects.toThrow(
        'A post can have at most 5 images',
      );
    });

    it('should reject more than 1 video', async () => {
      const dto = {
        content: 'Too many',
        postType: PostType.USER,
        user: 'user-123',
        attachmentType: AttachmentType.VIDEO,
      };
      const files = Array.from({ length: 2 }, () => makeFile('video/mp4'));

      await expect(service.create(dto, 'user-123', files)).rejects.toThrow(
        'A post can have at most 1 video',
      );
    });

    it('should reject more than 1 GIF without a URL', async () => {
      const dto = {
        content: 'GIF post',
        postType: PostType.USER,
        user: 'user-123',
        attachmentType: AttachmentType.GIF,
      };
      const files: FastifyMultipartFile[] = [];

      await expect(service.create(dto, 'user-123', files)).rejects.toThrow(
        'A GIF URL is required for GIF posts',
      );
    });

    it('should create a GIF post with a URL', async () => {
      const dto = {
        content: 'Funny GIF',
        postType: PostType.USER,
        user: 'user-123',
        attachmentType: AttachmentType.GIF,
        gifUrl: 'https://media.giphy.com/media/abc123/giphy.gif',
      };
      const files: FastifyMultipartFile[] = [];
      postRepository.findOne.mockResolvedValue(
        makePost({
          content: 'Funny GIF',
          attachments: [
            {
              url: 'https://media.giphy.com/media/abc123/giphy.gif',
              type: AttachmentType.GIF,
            },
          ],
        }),
      );

      const result = await service.create(dto, 'user-123', files);

      expect(bucketService.uploadFile).not.toHaveBeenCalled();
      expect(postRepository.create).toHaveBeenCalled();
      expect(result!.content).toBe('Funny GIF');
      expect(result!.attachments[0].url).toBe(
        'https://media.giphy.com/media/abc123/giphy.gif',
      );
    });

    it('should reject GIF post with empty URL', async () => {
      const dto = {
        content: 'GIF post',
        postType: PostType.USER,
        user: 'user-123',
        attachmentType: AttachmentType.GIF,
        gifUrl: '',
      };
      const files: FastifyMultipartFile[] = [];

      await expect(service.create(dto, 'user-123', files)).rejects.toThrow(
        'A GIF URL is required for GIF posts',
      );
    });

    it('should accept up to 5 images', async () => {
      const dto = {
        content: 'Multiple images',
        postType: PostType.USER,
        user: 'user-123',
        attachmentType: AttachmentType.IMAGE,
      };
      const files = Array.from({ length: 5 }, () => makeFile('image/png'));
      vi.mocked(bucketService.uploadFile).mockResolvedValue(
        'posts/123-file.png',
      );
      vi.mocked(bucketService.getTemporaryUrl).mockResolvedValue(
        'https://example.com/file.png',
      );
      postRepository.findOne.mockResolvedValue(
        makePost({
          content: 'Multiple images',
          attachments: Array.from({ length: 5 }, () => ({
            key: 'posts/123-file.png',
            type: AttachmentType.IMAGE,
          })),
        }),
      );

      const result = await service.create(dto, 'user-123', files);

      expect(bucketService.uploadFile).toHaveBeenCalledTimes(5);
      expect(postRepository.create).toHaveBeenCalled();
      expect(result!.content).toBe('Multiple images');
      expect(result!.attachments).toHaveLength(5);
    });
  });

  describe('likePost', () => {
    it('should like a post when not already liked', async () => {
      const post = makePost();
      postRepository.findOne.mockResolvedValue(post);
      postRepository.findOneOrFail.mockResolvedValue(post);
      likesRepository.findOne.mockResolvedValue(null);
      vi.mocked(bucketService.getTemporaryUrl).mockResolvedValue(
        'https://example.com/img.png',
      );

      const result = await service.likePost({
        postId: 'post-123',
        userId: 'user-456',
      });

      expect(likesRepository.create).toHaveBeenCalled();
      expect(result.like).toBe(true);
    });

    it('should unlike a post when already liked', async () => {
      const post = makePost();
      postRepository.findOne.mockResolvedValue(post);
      postRepository.findOneOrFail.mockResolvedValue(post);
      const existingLike = new Likes();
      likesRepository.findOne.mockResolvedValue(existingLike);
      vi.mocked(bucketService.getTemporaryUrl).mockResolvedValue(
        'https://example.com/img.png',
      );

      const result = await service.likePost({
        postId: 'post-123',
        userId: 'user-456',
      });

      expect(em.remove).toHaveBeenCalledWith(existingLike);
      expect(result.like).toBe(false);
    });

    it('should throw NotFoundException for unknown post', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(
        service.likePost({ postId: 'missing', userId: 'user-123' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete the post and its likes when author and within time window', async () => {
      const post = makePost();
      postRepository.findOne.mockResolvedValue(post);

      await service.delete('post-123', 'user-123');

      expect(postRepository.nativeDelete).toHaveBeenCalledWith({
        id: 'post-123',
      });
      expect(likesRepository.nativeDelete).toHaveBeenCalledWith({
        post: 'post-123',
      });
    });

    it('should throw NotFoundException when post does not exist', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('missing', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when not the author', async () => {
      const post = makePost();
      postRepository.findOne.mockResolvedValue(post);

      await expect(service.delete('post-123', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when post is older than 15 minutes', async () => {
      const post = makePost({
        createdAt: new Date(Date.now() - 16 * 60 * 1000),
      });
      postRepository.findOne.mockResolvedValue(post);

      await expect(service.delete('post-123', 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update content when author and within time window', async () => {
      const post = makePost();
      postRepository.findOne.mockResolvedValue(post);
      vi.mocked(bucketService.getTemporaryUrl).mockResolvedValue(
        'https://example.com/img.png',
      );

      const result = await service.update('post-123', 'user-123', {
        content: 'Updated content',
      });

      expect(post.content).toBe('Updated content');
      expect(result.content).toBe('Updated content');
    });

    it('should throw NotFoundException when post does not exist', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing', 'user-123', { content: 'New content' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the author', async () => {
      const post = makePost();
      postRepository.findOne.mockResolvedValue(post);

      await expect(
        service.update('post-123', 'other-user', { content: 'New content' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when post is older than 15 minutes', async () => {
      const post = makePost({
        createdAt: new Date(Date.now() - 16 * 60 * 1000),
      });
      postRepository.findOne.mockResolvedValue(post);

      await expect(
        service.update('post-123', 'user-123', { content: 'New content' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
