/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Comments } from '#/posts/entities/comments.entity.js';
import { CommentResponseDto } from '#/posts/dto/comment-response.dto.js';

type CommentResponseSource = Pick<
  Comments,
  'id' | 'user' | 'contentJson' | 'createdAt'
>;

export class CommentMapper {
  static toResponse(comment: CommentResponseSource): CommentResponseDto;
  static toResponse(
    comment: CommentResponseSource | undefined,
  ): CommentResponseDto | null;
  static toResponse(
    comment: CommentResponseSource | undefined,
  ): CommentResponseDto | null {
    if (!comment) return null;

    return {
      id: comment.id,
      contentJson: comment.contentJson,
      author: {
        id: comment.user.id,
        name: comment.user.name,
      },
      createdAt: comment.createdAt,
    };
  }
}
