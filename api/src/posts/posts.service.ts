/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { PaginationQueryDto } from '#/common/dto/pagination/pagination-query.dto.js';
import { PaginationResponseDto } from '#/common/dto/pagination/pagination-response.dto.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { User } from '#/users/entities/user.entity.js';
import { CreatePostDto } from '#/posts/dto/create-post.dto.js';
import { LikePostDto } from '#/posts/dto/like-post.dto.js';
import { Likes } from '#/posts/entities/likes.entity.js';
import { PostLikeResponseDto } from '#/common/dto/post-like-response.dto.js';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PostResponseDto } from '#/posts/dto/post-response.dto.js';
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
        orderBy: { createdAt: 'desc' },
        populate: ['likes'],
      },
    );

    const dataTransformed = await this.mapPostsToResponse(data);

    return new PaginationResponseDto(dataTransformed, total, page, limit);
  }

  /** Returns a single user by id, or throws 404. */
  async findById(id: string): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne(
      { id },
      { populate: ['likes'] },
    );
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    return (await this.mapPostsToResponse([post]))[0];
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
        orderBy: { createdAt: 'desc' },
        populate: ['likes'],
      },
    );

    const dataTransformed = await this.mapPostsToResponse(data);

    return new PaginationResponseDto(dataTransformed, total, page, limit);
  }

  /**
   * Creates a post: GIF posts use a URL, image/video posts upload files to S3.
   */
  async create(
    dto: CreatePostDto,
    files: FastifyMultipartFile[],
  ): Promise<PostResponseDto | null> {
    if (dto.gifUrl && files.length > 0) {
      throw new BadRequestException(
        'Only one attachment method is allowed: gifUrl or files, not both',
      );
    }

    const attachmentType = dto.attachmentType;
    let attachments: { key?: string; url?: string; type: string }[];

    if (attachmentType === AttachmentType.GIF) {
      // GIF posts accept a URL, no file upload
      this.validateGifUrl(dto.gifUrl);
      attachments = [{ url: dto.gifUrl, type: attachmentType }];
    } else {
      // Image and video posts require file uploads
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
    post.user = this.em.getReference(User, dto.user);
    this.postRepository.create(post);
    await this.em.flush();

    return (await this.mapPostsToResponse([post]))[0];
  }

  /** Validates that a GIF URL is provided when attachmentType is GIF. */
  private validateGifUrl(gifUrl: string | undefined) {
    if (!gifUrl || gifUrl.trim() === '') {
      throw new BadRequestException('A GIF URL is required for GIF posts');
    }
  }

  /**
   * Maps post entities to response DTOs, generating temporary URLs from S3 keys.
   * GIF attachments use their stored URL directly.
   */
  private async mapPostsToResponse(posts: Posts[]): Promise<PostResponseDto[]> {
    const results = await Promise.all(
      posts.map(async (post) => {
        const base = PostMapper.toResponse(post);
        if (!base) return null;

        const attachments = await Promise.all(
          post.attachments.map(async (a) => {
            // GIF attachments store the URL directly; others store an S3 key
            const url =
              a.url ?? (await this.bucketService.getTemporaryUrl(a.key!));
            return { url, type: a.type as AttachmentType };
          }),
        );

        return { ...base, attachments } as PostResponseDto;
      }),
    );
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

  async delete(postId: string): Promise<void> {
    await this.postRepository.nativeDelete({ id: postId });
    await this.likesRepository.nativeDelete({ post: postId });
    await this.em.flush();
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
