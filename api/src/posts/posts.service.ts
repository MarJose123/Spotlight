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
import { PostResponseDto } from '@/posts/dto/post-response.dto';
import { PostMapper } from '@/posts/mappers/post.mapper';
import { PostLikeMapper } from '@/posts/mappers/post-like.mapper';

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

    const dataTransformed = data.map((post) => PostMapper.toResponse(post));

    return new PaginationResponseDto(dataTransformed, total, page, limit);
  }

  /** Returns a single user by id, or throws 404. */
  async findById(id: string): Promise<PostResponseDto | null> {
    const post = await this.postRepository.findOne(
      { id },
      { populate: ['likes'] },
    );
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    return PostMapper.toResponse(post);
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

    const dataTransformed = data.map((post) => PostMapper.toResponse(post));

    return new PaginationResponseDto(dataTransformed, total, page, limit);
  }

  /** Creates and persists a new post from the given DTO. */
  async create(dto: CreatePostDto): Promise<PostResponseDto | null> {
    const post = new Posts();
    Object.assign(post, dto);
    this.postRepository.create(post);
    await this.em.flush();

    return PostMapper.toResponse(post);
  }

  /** Like a post. */
  async likePost(dto: LikePostDto): Promise<PostLikeResponseDto> {
    const post = await this.findById(dto.postId);

    if (!post) {
      throw new NotFoundException(`Post with id ${dto.postId} not found`);
    }

    const existingLike = await this.likesRepository.findOne({
      post: dto.postId,
      user: dto.userId,
    });

    if (existingLike) {
      // Unlike
      this.em.remove(existingLike);
      await this.decrementLikeCount(post);
      await this.em.flush();

      return PostLikeMapper.toResponse(false, post);
    }

    // Like
    const like = new Likes();
    Object.assign(like, dto);

    this.likesRepository.create(like);
    await this.incrementLikeCount(post);
    await this.em.flush();

    return PostLikeMapper.toResponse(true, post);
  }

  async delete(postId: string): Promise<void> {
    await this.postRepository.nativeDelete({ id: postId });
    await this.likesRepository.nativeDelete({ post: postId });
    await this.em.flush();
  }

  private async incrementLikeCount(postdto: PostResponseDto): Promise<void> {
    const post = await this.postRepository.findOneOrFail({ id: postdto.id });
    post.likesCount += 1;
    await this.em.flush();
  }

  private async decrementLikeCount(postdto: PostResponseDto): Promise<void> {
    const post = await this.postRepository.findOneOrFail({ id: postdto.id });
    post.likesCount = Math.min(0, post.likesCount - 1);
    await this.em.flush();
  }
}
