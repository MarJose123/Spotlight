import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { PaginationQueryDto } from '../common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '../common/dto/pagination/pagination-response.dto';
import { Posts } from './entities/posts.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { LikePostDto } from './dto/like-post.dto';
import { Likes } from './entities/likes.entity';
import { PostLikeResponseDto } from '../common/dto/post-like-response.dto';

@Injectable()
export class PostsService {
  constructor(private readonly em: EntityManager) {}

  /** Returns all posts. */
  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<Posts>> {
    const { page, limit } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.em.findAndCount(
      Posts,
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
    const post = await this.em.findOne(Posts, { id }, { populate: ['likes'] });
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

    const [data, total] = await this.em.findAndCount(
      Posts,
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
    this.em.persist(post);
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

    const existingLike = await this.em.findOne(Likes, {
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

    this.em.persist(like);
    await this.incrementLikeCount(post);
    await this.em.flush();

    return new PostLikeResponseDto(true, post);
  }
}
