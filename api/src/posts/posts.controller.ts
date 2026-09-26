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
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PostsService } from '@/posts/posts.service';
import { Auth } from '@/auth/guard/auth.guard';
import { CreatePostDto } from '@/posts/dto/create-post.dto';
import { PostResponseDto } from '@/posts/dto/post-response.dto';
import { LikePostDto, LikePostByIdDto } from '@/posts/dto/like-post.dto';
import { PostLikeResponseDto } from '@/common/dto/post-like-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';
import { minutes, seconds, Throttle } from '@nestjs/throttler';
import { BucketService } from '@/bucket/bucket.service';
import { GeneratePresignedUrlDto } from '@/bucket/dto/generate-presigned-url.dto';
import { PresignedUrlResponseDto } from '@/bucket/dto/presigned-url-response.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token.',
  type: ErrorResponseDto,
})
@Controller('posts')
@UseGuards(Auth)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly bucketService: BucketService,
  ) {}

  @ApiOperation({
    summary: 'List posts',
    description: 'Return a paginated list of every post, newest first.',
  })
  @ApiPaginatedResponse(PostResponseDto, 'Paginated list of posts.')
  @Get()
  async getPosts(@Query() paginationQuery: PaginationQueryDto) {
    return this.postsService.findAll(paginationQuery);
  }

  @ApiOperation({
    summary: 'List posts by user',
    description: 'Return a paginated list of the posts authored by a user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Id of the user whose posts should be returned.',
    format: 'uuid',
  })
  @ApiPaginatedResponse(PostResponseDto, "Paginated list of the user's posts.")
  @Get('/user/:id')
  async getPostsByUser(
    @Query() paginationQuery: PaginationQueryDto,
    @Param('id') id: string,
  ) {
    return this.postsService.findByUserId({ paginationQuery, userId: id });
  }

  @ApiOperation({
    summary: 'Create post',
    description: 'Create a new post.',
  })
  @ApiCreatedResponse({
    description: 'The post has been created.',
    type: PostResponseDto,
  })
  @Post()
  async createPost(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @ApiOperation({
    summary: 'Like or unlike a post',
    description:
      'Toggle the like of `userId` on `postId`. Returns the post with the updated like count.',
  })
  @ApiOkResponse({
    description: 'The like state and the updated post.',
    type: PostLikeResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The post does not exist.',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many like requests.',
    type: ErrorResponseDto,
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
    summary: 'Like or unlike a post by id',
    description:
      'Toggle a like on the post identified by the path parameter. Returns the post with the updated like count.',
  })
  @ApiParam({
    name: 'id',
    description: 'Id of the post to like or unlike.',
    format: 'uuid',
  })
  @ApiBody({ type: LikePostByIdDto })
  @ApiOkResponse({
    description: 'The like state and the updated post.',
    type: PostLikeResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The post does not exist.',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many like requests.',
    type: ErrorResponseDto,
  })
  @Post('/:id/like')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: 2, ttl: seconds(1), blockDuration: minutes(5) },
  })
  async likePostById(@Param('id') id: string, @Body('user') user: string) {
    return await this.postsService.likePost({ postId: id, userId: user });
  }

  @ApiOperation({
    summary: 'Generate a pre-signed upload URL',
    description:
      'Return a pre-signed URL the client can `PUT` an attachment to, together with the object key it will be stored under.',
  })
  @ApiOkResponse({
    description: 'Pre-signed upload URL generated.',
    type: PresignedUrlResponseDto,
  })
  @Get('/upload/pre-signed-url')
  @HttpCode(HttpStatus.OK)
  async uploadPhotos(@Query() dto: GeneratePresignedUrlDto) {
    return await this.bucketService.generatePresignedUploadUrl(dto);
  }
}
