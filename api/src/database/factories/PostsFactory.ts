/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Factory } from '@mikro-orm/seeder';
import { fakerEN as faker } from '@faker-js/faker';
import { Posts } from '#/posts/entities/posts.entity.js';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';
import { PostType } from '#/posts/enums/post-type.enum.js';

export class PostsFactory extends Factory<Posts> {
  model = Posts;

  definition(): Partial<Posts> {
    return {
      contentJson: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: faker.word.words({ count: { min: 4, max: 12 } }),
              },
            ],
          },
        ],
      }),
      attachments: [
        { key: 'posts/seed-image.png', type: AttachmentType.IMAGE },
      ],
      postType: PostType.USER,
    };
  }
}
