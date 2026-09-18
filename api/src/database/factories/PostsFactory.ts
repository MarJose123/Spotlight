/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { Posts } from '@/posts/entities/posts.entity';
import { AttachmentType } from '@/posts/enums/attachment-type.enum';
import { PostType } from '@/posts/enums/post-type.enum';

export class PostsFactory extends Factory<Posts> {
  model = Posts;

  definition(): Partial<Posts> {
    return {
      content: faker.lorem.sentence(),
      attachment: faker.image.url(),
      attachmentType: AttachmentType.IMAGE,
      postType: PostType.USER,
    };
  }
}
