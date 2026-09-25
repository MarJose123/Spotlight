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
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PostsService } from '@/posts/posts.service';
import { Auth } from '@/auth/guard/auth.guard';
import { CreatePostDto } from '@/posts/dto/create-post.dto';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Posts } from '@/posts/entities/posts.entity';
import { PaginationResponseDto } from '@/common/dto/pagination/pagination-response.dto';
import { LikePostDto } from '@/posts/dto/like-post.dto';
import { minutes, seconds, Throttle } from '@nestjs/throttler';
import { BucketService } from '@/bucket/bucket.service';
import { GeneratePresignedUrlDto } from '@/bucket/dto/generate-presigned-url.dto';

@ApiBearerAuth()
@Controller('posts')
@UseGuards(Auth)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly bucketService: BucketService,
  ) {}

  @ApiOperation({
    summary: 'Get all post',
    description: 'Get all post',
  })
  @ApiOkResponse({
    description: 'success',
    type: PaginationResponseDto<Posts>,
  })
  @Get()
  async getPosts(@Query() paginationQuery: PaginationQueryDto) {
    return this.postsService.findAll(paginationQuery);
  }

  @ApiOperation({
    summary: 'Get post by user id',
    description: 'Get post by user id',
  })
  @ApiOkResponse({
    description: 'success',
    type: PaginationResponseDto<Posts>,
  })
  @Get('/user/:id')
  async getPostsByUser(
    @Query() paginationQuery: PaginationQueryDto,
    @Param('id') id: string,
  ) {
    return this.postsService.findByUserId({ paginationQuery, userId: id });
  }

  @ApiOperation({
    summary: 'Create post',
    description: 'Create post',
  })
  @ApiOkResponse({
    description: 'success',
    type: Posts,
  })
  @Post()
  async createPost(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @ApiOperation({
    summary: 'Like post',
    description: 'Like post',
  })
  @ApiOkResponse({
    description: 'success',
    type: Posts,
  })
  @Put('/like')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: 2, ttl: seconds(1), blockDuration: minutes(5) },
  })
  async likePost(@Body() dto: LikePostDto) {
    return await this.postsService.likePost(dto);
  }

  @ApiOperation({
    summary: 'Like post by id',
    description: 'Like post by id',
  })
  @ApiOkResponse({
    description: 'success',
    type: Posts,
  })
  @Post('/:id/like')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: 2, ttl: seconds(1), blockDuration: minutes(5) },
  })
  async likePostById(@Param('id') id: string, @Body('user') user: string) {
    return await this.postsService.likePost({ post: id, user });
  }

  @ApiOperation({
    summary: 'Upload Photo URL',
    description: 'Retrieve Presigned Upload URL',
  })
  @ApiOkResponse({
    description: 'success',
    type: 'string',
  })
  @Get('/upload/pre-signed-url')
  @HttpCode(HttpStatus.OK)
  async uploadPhotos(@Query() dto: GeneratePresignedUrlDto) {
    return await this.bucketService.generatePresignedUploadUrl(dto);
  }
}
