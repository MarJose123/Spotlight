/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect } from 'vitest';
import { PostMapper } from '#/posts/mappers/post.mapper.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { User } from '#/users/entities/user.entity.js';
import { Likes } from '#/posts/entities/likes.entity.js';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';
import { PostType } from '#/posts/enums/post-type.enum.js';

describe('PostMapper', () => {
  const makeUser = (id = 'user-123') => {
    const user = new User();
    Object.assign(user, { id });
    return user;
  };

  const makeLike = (userId: string) => {
    const like = new Likes();
    like.user = makeUser(userId);
    return like;
  };

  const makePost = (overrides = {}) => {
    const post = new Posts();
    Object.assign(post, {
      id: 'post-123',
      contentJson: 'Great work!',
      attachments: [{ key: 'posts/img.png', type: AttachmentType.IMAGE }],
      postType: PostType.USER,
      user: makeUser(),
      likes: [makeLike('user-456'), makeLike('user-789')],
      likesCount: 2,
      createdAt: new Date('2024-01-01'),
      ...overrides,
    });
    return post;
  };

  describe('toResponse', () => {
    it('should return null for undefined input', () => {
      expect(PostMapper.toResponse(undefined)).toBeNull();
    });

    it('should map all post fields', () => {
      const post = makePost();
      const result = PostMapper.toResponse(post);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('post-123');
      expect(result!.author.id).toBe('user-123');
      expect(result!.author.name).toBeUndefined();
      expect(result!.contentJson).toBe('Great work!');
      expect(result!.postType).toBe(PostType.USER);
      expect(result!.likedBy).toEqual(['user-456', 'user-789']);
      expect(result!.likesCount).toBe(2);
      expect(result!.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should handle empty likes', () => {
      const post = makePost({ likes: [], likesCount: 0 });
      const result = PostMapper.toResponse(post);

      expect(result!.likedBy).toEqual([]);
      expect(result!.likesCount).toBe(0);
    });
  });
});
