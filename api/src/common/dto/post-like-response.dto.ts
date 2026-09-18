/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Posts } from '@/posts/entities/posts.entity';

export class PostLikeResponseDto {
  like: boolean;
  post: Posts;

  constructor(like: boolean, post: Posts) {
    this.like = like;
    this.post = post;
  }
}
