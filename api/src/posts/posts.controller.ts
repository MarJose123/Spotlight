/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { minutes, seconds, Throttle } from '@nestjs/throttler';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PostsService } from '@/posts/posts.service';
import { Auth } from '@/auth/guard/auth.guard';
import { CreatePostDto } from '@/posts/dto/create-post.dto';
import { LikePostDto } from '@/posts/dto/like-post.dto';
import { BucketService } from '@/bucket/bucket.service';
import { GeneratePresignedUrlDto } from '@/bucket/dto/generate-presigned-url.dto';
import { ApiAuthenticated } from '@/common/decorators/api-authenticated.decorator';
import {
  ApiCreatePost,
  ApiLikePost,
  ApiLikePostById,
  ApiListPosts,
  ApiListUserPosts,
  ApiPresignedUpload,
} from '@/posts/decorators/post-api.decorator';

@ApiTags('Posts')
@ApiAuthenticated()
@Controller('posts')
@UseGuards(Auth)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly bucketService: BucketService,
  ) {}

  @ApiListPosts()
  @Get()
  async getPosts(@Query() paginationQuery: PaginationQueryDto) {
    return this.postsService.findAll(paginationQuery);
  }

  @ApiListUserPosts()
  @Get('/user/:id')
  async getPostsByUser(
    @Query() paginationQuery: PaginationQueryDto,
    @Param('id') id: string,
  ) {
    return this.postsService.findByUserId({ paginationQuery, userId: id });
  }

  @ApiCreatePost()
  @Post()
  async createPost(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @ApiLikePost()
  @Throttle({
    default: { limit: 2, ttl: seconds(1), blockDuration: minutes(5) },
  })
  @Put('/like')
  async likePost(@Body() dto: LikePostDto) {
    return await this.postsService.likePost(dto);
  }

  @ApiLikePostById()
  @Throttle({
    default: { limit: 2, ttl: seconds(1), blockDuration: minutes(5) },
  })
  @Post('/:id/like')
  async likePostById(@Param('id') id: string, @Body('user') user: string) {
    return await this.postsService.likePost({ postId: id, userId: user });
  }

  @ApiPresignedUpload()
  @Get('/upload/pre-signed-url')
  async uploadPhotos(@Query() dto: GeneratePresignedUrlDto) {
    return await this.bucketService.generatePresignedUploadUrl(dto);
  }
}
