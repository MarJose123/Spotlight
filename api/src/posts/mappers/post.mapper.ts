/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Posts } from '#/posts/entities/posts.entity.js';
import {
  PostAuthorDto,
  PostResponseDto,
} from '#/posts/dto/post-response.dto.js';
import { Likes } from '#/posts/entities/likes.entity.js';

type PostResponseSource = Pick<
  Posts,
  | 'id'
  | 'user'
  | 'content'
  | 'postType'
  | 'likes'
  | 'likesCount'
  | 'commentsCount'
  | 'createdAt'
>;

type PostResponseBase = Omit<PostResponseDto, 'attachments'>;

function mapAuthor(post: PostResponseSource): PostAuthorDto {
  const user = post.user;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatar,
  };
}

export class PostMapper {
  static toResponse(post: PostResponseSource): PostResponseBase;
  static toResponse(
    post: PostResponseSource | undefined,
  ): PostResponseBase | null;
  static toResponse(
    post: PostResponseSource | undefined,
  ): PostResponseBase | null {
    if (!post) return null;

    return {
      id: post.id,
      author: mapAuthor(post),
      content: post.content,
      postType: post.postType,
      likedBy: post.likes?.map((like: Likes) => like.user.id),
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      createdAt: post.createdAt,
    };
  }
}
