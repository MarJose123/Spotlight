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
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { minutes, seconds, Throttle } from '@nestjs/throttler';
import { PaginationQueryDto } from '#/common/dto/pagination/pagination-query.dto.js';
import { PostsService } from '#/posts/posts.service.js';
import { Auth } from '#/auth/guard/auth.guard.js';
import { CreatePostDto } from '#/posts/dto/create-post.dto.js';
import { LikePostDto } from '#/posts/dto/like-post.dto.js';
import {
  ApiCreatePost,
  ApiLikePost,
  ApiLikePostById,
  ApiListPosts,
  ApiListUserPosts,
} from '#/posts/decorators/post-api.decorator.js';
import { ApiAuthenticated } from '#/common/decorators/api-authenticated.decorator.js';
import { MultipartFileInterceptor } from '#/common/interceptors/multipart-file.interceptor.js';
import { UploadedFiles } from '#/common/decorators/uploaded-files.decorator.js';
import type { FastifyMultipartFile } from '#/common/interceptors/multipart-file.interceptor.js';

@ApiTags('Posts')
@ApiAuthenticated()
@Controller('posts')
@UseGuards(Auth)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

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
  @Throttle({
    default: { limit: 3, ttl: seconds(1), blockDuration: minutes(5) },
  })
  @UseInterceptors(new MultipartFileInterceptor('file'))
  async createPost(
    @Body() dto: CreatePostDto,
    @UploadedFiles() files: FastifyMultipartFile[],
  ) {
    return this.postsService.create(dto, files);
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
}
