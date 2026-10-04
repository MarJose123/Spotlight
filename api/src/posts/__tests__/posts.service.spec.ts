/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PostsService } from '#/posts/posts.service.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { Likes } from '#/posts/entities/likes.entity.js';
import { User } from '#/users/entities/user.entity.js';
import { AttachmentType } from '#/posts/enums/attachment-type.enum.js';
import { PostType } from '#/posts/enums/post-type.enum.js';

describe('PostsService', () => {
  let service: PostsService;
  let postRepository: any;
  let likesRepository: any;
  let em: any;

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
      attachmentType: AttachmentType.IMAGE,
      attachment: ['https://example.com/img.png'],
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

  beforeEach(() => {
    vi.clearAllMocks();
    postRepository = mockPostRepo();
    likesRepository = mockLikesRepo();
    em = mockEm();
    service = new PostsService(postRepository, likesRepository, em);
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const posts = [makePost({ id: 'a' }), makePost({ id: 'b' })];
      postRepository.findAndCount.mockResolvedValue([posts, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(postRepository.findAndCount).toHaveBeenCalledWith(
        {},
        {
          offset: 0,
          limit: 10,
          orderBy: { createdAt: 'desc' },
          populate: ['likes'],
        },
      );
    });
  });

  describe('findById', () => {
    it('should return the post when found', async () => {
      const post = makePost();
      postRepository.findOne.mockResolvedValue(post);

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
          orderBy: { createdAt: 'desc' },
          populate: ['likes'],
        },
      );
    });
  });

  describe('create', () => {
    it('should create and persist a post', async () => {
      const dto = {
        content: 'Thanks!',
        attachmentType: AttachmentType.IMAGE,
        attachment: ['https://example.com/img.png'],
        postType: PostType.USER,
        user: 'user-123',
      };

      const result = await service.create(dto);

      expect(postRepository.create).toHaveBeenCalled();
      expect(em.flush).toHaveBeenCalled();
      expect(result!.content).toBe('Thanks!');
    });
  });

  describe('likePost', () => {
    it('should like a post when not already liked', async () => {
      const post = makePost();
      postRepository.findOne.mockResolvedValue(post);
      postRepository.findOneOrFail.mockResolvedValue(post);
      likesRepository.findOne.mockResolvedValue(null);

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
    it('should delete the post and its likes', async () => {
      await service.delete('post-123');

      expect(postRepository.nativeDelete).toHaveBeenCalledWith({
        id: 'post-123',
      });
      expect(likesRepository.nativeDelete).toHaveBeenCalledWith({
        post: 'post-123',
      });
    });

    it('should delete likes even if post does not exist', async () => {
      await service.delete('missing');

      expect(postRepository.nativeDelete).toHaveBeenCalledWith({
        id: 'missing',
      });
      expect(likesRepository.nativeDelete).toHaveBeenCalledWith({
        post: 'missing',
      });
    });
  });
});
