/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Comments } from '#/posts/entities/comments.entity.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { User } from '#/users/entities/user.entity.js';
import { CreateCommentDto } from '#/posts/dto/create-comment.dto.js';
import { CommentResponseDto } from '#/posts/dto/comment-response.dto.js';
import { CommentMapper } from '#/posts/mappers/comment.mapper.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comments)
    private readonly commentsRepository: EntityRepository<Comments>,
    @InjectRepository(Posts)
    private readonly postsRepository: EntityRepository<Posts>,
    private readonly em: EntityManager,
  ) {}

  /** Create a comment on a post. Throws 404 if the post does not exist. */
  async create(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const post = await this.postsRepository.findOne({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    post.commentsCount += 1;

    const comment = new Comments();
    comment.content = dto.content;
    comment.post = this.em.getReference(Posts, postId);
    comment.user = this.em.getReference(User, userId);

    this.commentsRepository.create(comment);
    await this.em.flush();

    return CommentMapper.toResponse(comment)!;
  }

  /** Find all comments for a post, ordered newest first. */
  async findByPost(postId: string): Promise<CommentResponseDto[]> {
    const comments = await this.commentsRepository.find(
      { post: postId },
      { orderBy: { createdAt: 'desc' } },
    );

    return comments
      .map((c) => CommentMapper.toResponse(c))
      .filter((c): c is CommentResponseDto => c !== null);
  }
}
