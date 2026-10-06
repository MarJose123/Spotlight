/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import { IsNotEmpty } from 'class-validator';
import { PostType } from '#/posts/enums/post-type.enum.js';
import { User } from '#/users/entities/user.entity.js';
import { Likes } from '#/posts/entities/likes.entity.js';
import { Comments } from '#/posts/entities/comments.entity.js';
import { Collection, type Rel } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

export interface AttachmentItem {
  key?: string;
  url?: string;
  type: string;
}

@Entity({ tableName: 'posts' })
export class Posts {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @PrimaryKey({ type: 'uuid' })
  @Index()
  id: string = randomUUID();

  @ApiProperty({ type: 'string' })
  @Property({ type: 'text' })
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        url: { type: 'string' },
        type: { type: 'string' },
      },
    },
  })
  @Property({ type: 'json' })
  @IsNotEmpty()
  attachments!: AttachmentItem[];

  @ApiProperty({
    type: 'string',
    format: 'enum',
    enum: PostType,
    default: PostType.USER,
  })
  @Property()
  @Enum({ items: () => PostType, default: PostType.USER })
  @IsNotEmpty()
  postType: PostType = PostType.USER;

  @ApiProperty({ type: 'string', format: 'uuid' })
  @ManyToOne(() => User)
  user!: Rel<User>;

  @ApiProperty({ type: Object, format: 'uuid', isArray: true })
  @OneToMany(() => Likes, (like: Likes) => like.post)
  likes? = new Collection<Likes>(this);

  @Property({ type: 'number', default: 0 })
  likesCount: number = 0;

  @ApiProperty({ type: Object, format: 'uuid', isArray: true })
  @OneToMany(() => Comments, (comment: Comments) => comment.post)
  comments? = new Collection<Comments>(this);

  @Property({ type: 'number', default: 0 })
  commentsCount: number = 0;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @ApiProperty({ type: 'string', format: 'date-time' })
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
