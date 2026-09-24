/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostsController } from '@/posts/posts.controller';
import { PostsService } from '@/posts/posts.service';
import { AuthModule } from '@/auth/auth.module';
import { BucketModule } from '@/bucket/bucket.module';
import { Posts } from '@/posts/entities/posts.entity';
import { Likes } from '@/posts/entities/likes.entity';

@Module({
  imports: [
    AuthModule,
    BucketModule,
    MikroOrmModule.forFeature([Posts, Likes]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
