/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '@/common/dto/pagination/pagination-response.dto';
import { Posts } from '@/posts/entities/posts.entity';
import { CreatePostDto } from '@/posts/dto/create-post.dto';
import { LikePostDto } from '@/posts/dto/like-post.dto';
import { Likes } from '@/posts/entities/likes.entity';
import { PostLikeResponseDto } from '@/common/dto/post-like-response.dto';
import { InjectRepository } from '@mikro-orm/nestjs';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Posts)
    private readonly postRepository: EntityRepository<Posts>,
    @InjectRepository(Likes)
    private readonly likesRepository: EntityRepository<Likes>,
    private readonly em: EntityManager,
  ) {}

  /** Returns all posts. */
  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<Posts>> {
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

    return new PaginationResponseDto(data, total, page, limit);
  }

  /** Returns a single user by id, or throws 404. */
  async findById(id: string): Promise<Posts> {
    const post = await this.postRepository.findOne(
      { id },
      { populate: ['likes'] },
    );
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    return post;
  }

  /** Retrieves posts by user id. */
  async findByUserId({
    paginationQuery,
    userId,
  }: {
    paginationQuery: PaginationQueryDto;
    userId: string;
  }): Promise<PaginationResponseDto<Posts>> {
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

    return new PaginationResponseDto(data, total, page, limit);
  }

  /** Creates and persists a new post from the given DTO. */
  async create(dto: CreatePostDto): Promise<Posts> {
    const post = new Posts();
    Object.assign(post, dto);
    this.postRepository.create(post);
    await this.em.flush();

    return post;
  }

  private async incrementLikeCount(post: Posts): Promise<void> {
    post.likesCount += 1;
  }

  private async decrementLikeCount(post: Posts): Promise<void> {
    post.likesCount = Math.max(0, post.likesCount - 1);
  }

  /** Like a post. */
  async likePost(dto: LikePostDto): Promise<PostLikeResponseDto> {
    const post = await this.findById(dto.post);

    if (!post) {
      throw new NotFoundException(`Post with id ${dto.post} not found`);
    }

    const existingLike = await this.likesRepository.findOne({
      post: dto.post,
      user: dto.user,
    });

    if (existingLike) {
      // Unlike
      this.em.remove(existingLike);
      await this.decrementLikeCount(post);
      await this.em.flush();

      return new PostLikeResponseDto(false, post);
    }

    // Like
    const like = new Likes();
    Object.assign(like, dto);

    this.likesRepository.create(like);
    await this.incrementLikeCount(post);
    await this.em.flush();

    return new PostLikeResponseDto(true, post);
  }
}
