/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostsController } from '#/posts/posts.controller.js';
import { AttachmentController } from '#/posts/attachment.controller.js';
import { PostsService } from '#/posts/posts.service.js';
import { CommentsService } from '#/posts/comments.service.js';
import { AuthModule } from '#/auth/auth.module.js';
import { BucketModule } from '#/bucket/bucket.module.js';
import { Posts } from '#/posts/entities/posts.entity.js';
import { Likes } from '#/posts/entities/likes.entity.js';
import { Comments } from '#/posts/entities/comments.entity.js';

@Module({
  imports: [
    AuthModule,
    BucketModule,
    MikroOrmModule.forFeature([Posts, Likes, Comments]),
  ],
  controllers: [PostsController, AttachmentController],
  providers: [PostsService, CommentsService],
})
export class PostsModule {}
