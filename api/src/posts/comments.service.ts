/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Comments } from '#/posts/entities/comments.entity.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { User } from '#/users/entities/user.entity.js';
import { CreateCommentDto } from '#/posts/dto/create-comment.dto.js';
import { UpdateCommentDto } from '#/posts/dto/update-comment.dto.js';
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
      { orderBy: { createdAt: 'desc' }, populate: ['user'] },
    );

    return comments
      .map((c) => CommentMapper.toResponse(c))
      .filter((c): c is CommentResponseDto => c !== null);
  }

  /**
   * Guard that ensures the request comes from the comment author and the comment
   * is less than 15 minutes old. Throws 403 if either check fails.
   */
  private assertAuthorAndTimeWindow(comment: Comments, userId: string) {
    if (comment.user.id !== userId) {
      throw new ForbiddenException('Only the author can modify this comment');
    }
    const ageMinutes = (Date.now() - comment.createdAt.getTime()) / 60000;
    if (ageMinutes > 15) {
      throw new ForbiddenException(
        'Comments can only be edited or deleted within 15 minutes of creation',
      );
    }
  }

  /** Update a comment's content. Only the author may edit, and only within 15 minutes. */
  async update(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentsRepository.findOne(
      { id: commentId },
      { populate: ['user'] },
    );
    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }
    this.assertAuthorAndTimeWindow(comment, userId);

    comment.content = dto.content;
    await this.em.flush();

    return CommentMapper.toResponse(comment)!;
  }

  /** Delete a comment. Only the author may delete, and only within 15 minutes. */
  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentsRepository.findOne(
      { id: commentId },
      { populate: ['user', 'post'] },
    );
    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }
    this.assertAuthorAndTimeWindow(comment, userId);

    // Decrement the post's comments count
    comment.post.commentsCount = Math.max(0, comment.post.commentsCount - 1);

    this.em.remove(comment);
    await this.em.flush();
  }
}
