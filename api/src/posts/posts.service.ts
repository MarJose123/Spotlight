/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { PaginationQueryDto } from '#/common/dto/pagination/pagination-query.dto.js';
import { PaginationResponseDto } from '#/common/dto/pagination/pagination-response.dto.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { User } from '#/users/entities/user.entity.js';
import { CreatePostDto } from '#/posts/dto/create-post.dto.js';
import { UpdatePostDto } from '#/posts/dto/update-post.dto.js';
import { LikePostDto } from '#/posts/dto/like-post.dto.js';
import { Likes } from '#/posts/entities/likes.entity.js';
import { PostLikeResponseDto } from '#/common/dto/post-like-response.dto.js';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PostResponseDto } from '#/posts/dto/post-response.dto.js';
import { PostLikerDto } from '#/posts/dto/post-liker.dto.js';
import { PostMapper } from '#/posts/mappers/post.mapper.js';
import { PostLikeMapper } from '#/posts/mappers/post-like.mapper.js';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';
import { BucketService } from '#/bucket/bucket.service.js';
import type { FastifyMultipartFile } from '#/common/interceptors/multipart-file.interceptor.js';

@Injectable()
export class PostsService {
  // Maximum attachments per type per post
  private readonly MAX_IMAGES = 5;
  private readonly MAX_VIDEOS = 1;

  constructor(
    @InjectRepository(Posts)
    private readonly postRepository: EntityRepository<Posts>,
    @InjectRepository(Likes)
    private readonly likesRepository: EntityRepository<Likes>,
    private readonly em: EntityManager,
    private readonly bucketService: BucketService,
  ) {}

  /** Returns all posts. */
  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<PostResponseDto | null>> {
    const { page, limit } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.postRepository.findAndCount(
      {},
      {
        offset: skip,
        limit,
        orderBy: { createdAt: 'desc', id: 'desc' },
        populate: ['user', 'likes.user'],
      },
    );

    const dataTransformed = this.mapPostsToResponse(data);

    return new PaginationResponseDto(dataTransformed, total, page, limit);
  }

  /** Returns a single user by id, or throws 404. */
  async findById(id: string): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne(
      { id },
      { populate: ['user', 'likes.user'] },
    );
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    return this.mapPostsToResponse([post])[0];
  }

  /** Retrieves posts by user id. */
  async findByUserId({
    paginationQuery,
    userId,
  }: {
    paginationQuery: PaginationQueryDto;
    userId: string;
  }): Promise<PaginationResponseDto<PostResponseDto | null>> {
    const { page, limit } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.postRepository.findAndCount(
      { user: userId },
      {
        offset: skip,
        limit,
        orderBy: { createdAt: 'desc', id: 'desc' },
        populate: ['user', 'likes.user'],
      },
    );

    const dataTransformed = this.mapPostsToResponse(data);

    return new PaginationResponseDto(dataTransformed, total, page, limit);
  }

  /**
   * Creates a post: TEXT posts have no attachments, GIF posts use a URL,
   * image/video posts upload files to S3.
   */
  async create(
    dto: CreatePostDto,
    userId: string,
    files: FastifyMultipartFile[],
  ): Promise<PostResponseDto | null> {
    if (dto.gifUrl && files.length > 0) {
      throw new BadRequestException(
        'Only one attachment method is allowed: gifUrl or files, not both',
      );
    }

    const attachmentType = dto.attachmentType;
    let attachments: { key?: string; url?: string; type: string }[];

    if (attachmentType === AttachmentType.TEXT) {
      attachments = [];
    } else if (attachmentType === AttachmentType.GIF) {
      this.validateGifUrl(dto.gifUrl);
      attachments = [{ url: dto.gifUrl, type: attachmentType }];
    } else {
      this.validateAttachments(files.length, attachmentType);
      attachments = await Promise.all(
        files.map(async (file) => {
          const key = await this.bucketService.uploadFile(file, attachmentType);
          return { key, type: attachmentType };
        }),
      );
    }

    const post = new Posts();
    post.content = dto.content;
    post.attachments = attachments;
    post.user = this.em.getReference(User, userId);
    this.postRepository.create(post);
    await this.em.flush();

    const populated = await this.postRepository.findOne(
      { id: post.id },
      { populate: ['user', 'likes.user'] },
    );
    if (!populated) return null;
    return this.mapPostsToResponse([populated])[0];
  }

  /** Validates that a GIF URL is provided when attachmentType is GIF. */
  private validateGifUrl(gifUrl: string | undefined) {
    if (!gifUrl || gifUrl.trim() === '') {
      throw new BadRequestException('A GIF URL is required for GIF posts');
    }
  }

  /**
   * Maps post entities to response DTOs, converting S3 keys to relative API
   * paths. GIF attachments use their stored URL directly.
   */
  private mapPostsToResponse(posts: Posts[]): PostResponseDto[] {
    const results = posts.map((post) => {
      const base = PostMapper.toResponse(post);
      if (!base) return null;

      const attachments = post.attachments.map((a) => {
        // GIF attachments store the URL directly; others store an S3 key
        // that is resolved via the API proxy endpoint
        const url =
          a.url ?? `/api/v1/posts/attachment/${encodeURIComponent(a.key!)}`;
        return { url, type: a.type as AttachmentType };
      });

      return { ...base, attachments } as PostResponseDto;
    });
    return results.filter((r): r is PostResponseDto => r !== null);
  }

  /** Validates attachment count for a single type: max 5 images, 1 video. */
  private validateAttachments(count: number, type: AttachmentType) {
    if (type === AttachmentType.IMAGE && count > this.MAX_IMAGES) {
      throw new BadRequestException(
        `A post can have at most ${this.MAX_IMAGES} images`,
      );
    }
    if (type === AttachmentType.VIDEO && count > this.MAX_VIDEOS) {
      throw new BadRequestException(
        `A post can have at most ${this.MAX_VIDEOS} video`,
      );
    }
  }

  /**
   * Guard that ensures the request comes from the post author and the post is
   * less than 15 minutes old. Throws 403 or 410 accordingly.
   */
  private assertAuthorAndTimeWindow(post: Posts, userId: string) {
    if (post.user.id !== userId) {
      throw new ForbiddenException('Only the author can modify this post');
    }
    const ageMinutes = (Date.now() - post.createdAt.getTime()) / 60000;
    if (ageMinutes > 15) {
      throw new ForbiddenException(
        'Posts can only be edited or deleted within 15 minutes of creation',
      );
    }
  }

  /** Update a post's content. Only the author may edit, and only within 15 minutes. */
  async update(
    id: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne(
      { id },
      { populate: ['user', 'likes.user'] },
    );
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    this.assertAuthorAndTimeWindow(post, userId);

    post.content = dto.content;
    await this.em.flush();

    return this.mapPostsToResponse([post])[0];
  }

  /** Delete a post. Only the author may delete, and only within 15 minutes. */
  async delete(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({ id });
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    this.assertAuthorAndTimeWindow(post, userId);

    await this.postRepository.nativeDelete({ id });
    await this.likesRepository.nativeDelete({ post: id });
    await this.em.flush();
  }

  /** Return the list of users who liked a post. */
  async findLikesByPost(postId: string): Promise<PostLikerDto[]> {
    const post = await this.postRepository.findOne({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }
    const likes = await this.likesRepository.find(
      { post: postId },
      { populate: ['user'], orderBy: { createdAt: 'desc' } },
    );
    return likes.map((like) => ({
      id: like.user.id,
      name: like.user.name,
      avatarUrl: like.user.avatar,
    }));
  }

  /** Like a post. */
  async likePost(dto: LikePostDto): Promise<PostLikeResponseDto> {
    const post = await this.findById(dto.postId);

    const existingLike = await this.likesRepository.findOne({
      post: dto.postId,
      user: dto.userId,
    });

    if (existingLike) {
      // Unlike
      this.em.remove(existingLike);
      await this.decrementLikeCount(post);
      post.likedBy = (post.likedBy ?? []).filter(
        (id: string) => id !== dto.userId,
      );
      await this.em.flush();

      return PostLikeMapper.toResponse(false, post);
    }

    // Like
    const like = new Likes();
    like.post = this.em.getReference(Posts, dto.postId);
    like.user = this.em.getReference(User, dto.userId);

    this.likesRepository.create(like);
    await this.incrementLikeCount(post);
    post.likedBy = [...(post.likedBy ?? []), dto.userId];
    await this.em.flush();

    return PostLikeMapper.toResponse(true, post);
  }

  private async incrementLikeCount(postDto: PostResponseDto): Promise<void> {
    const post = await this.postRepository.findOneOrFail({ id: postDto.id });
    post.likesCount += 1;
    postDto.likesCount = post.likesCount;
    await this.em.flush();
  }

  private async decrementLikeCount(postDto: PostResponseDto): Promise<void> {
    const post = await this.postRepository.findOneOrFail({ id: postDto.id });
    post.likesCount = Math.max(0, post.likesCount - 1);
    postDto.likesCount = post.likesCount;
    await this.em.flush();
  }
}
