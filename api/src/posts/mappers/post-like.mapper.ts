/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { PostResponseDto } from '#/posts/dto/post-response.dto.js';
import { PostLikeResponseDto } from '#/common/dto/post-like-response.dto.js';

export class PostLikeMapper {
  static toResponse(
    like: boolean,
    postdto: PostResponseDto,
  ): PostLikeResponseDto {
    return {
      like,
      post: postdto,
    };
  }
}
