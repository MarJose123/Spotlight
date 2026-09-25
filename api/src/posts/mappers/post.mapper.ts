/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Posts } from '@/posts/entities/posts.entity';
import { PostResponseDto } from '@/posts/dto/post-response.dto';

type PostResponseSource = Pick<
  Posts,
  | 'id'
  | 'user'
  | 'content'
  | 'attachment'
  | 'attachmentType'
  | 'postType'
  | 'likes'
  | 'likesCount'
  | 'createdAt'
>;

export class PostMapper {
  static toResponse(
    post: PostResponseSource | undefined,
  ): PostResponseDto | null {
    if (!post) return null;

    return {
      id: post.id,
      userId: post.user.id,
      content: post.content,
      attachment: post.attachment,
      attachmentType: post.attachmentType,
      postType: post.postType,
      likedBy: post.likes?.map((like) => like.user.id),
      likesCount: post.likesCount,
      createdAt: post.createdAt,
    };
  }
}
