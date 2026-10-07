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
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { minutes, seconds, Throttle } from '@nestjs/throttler';
import { PaginationQueryDto } from '#/common/dto/pagination/pagination-query.dto.js';
import { PostsService } from '#/posts/posts.service.js';
import { CommentsService } from '#/posts/comments.service.js';
import { Auth } from '#/auth/guard/auth.guard.js';
import { CreateCommentDto } from '#/posts/dto/create-comment.dto.js';
import { UpdateCommentDto } from '#/posts/dto/update-comment.dto.js';
import { CreatePostDto } from '#/posts/dto/create-post.dto.js';
import { UpdatePostDto } from '#/posts/dto/update-post.dto.js';
import { LikePostDto } from '#/posts/dto/like-post.dto.js';
import {
  ApiCreatePost,
  ApiLikePost,
  ApiLikePostById,
  ApiListPosts,
  ApiListUserPosts,
  ApiListLikes,
  ApiCommentPost,
  ApiListComments,
  ApiUpdatePost,
  ApiDeletePost,
  ApiUpdateComment,
  ApiDeleteComment,
} from '#/posts/decorators/post-api.decorator.js';
import { ApiAuthenticated } from '#/common/decorators/api-authenticated.decorator.js';
import { MultipartFileInterceptor } from '#/common/interceptors/multipart-file.interceptor.js';
import { UploadedFiles } from '#/common/decorators/uploaded-files.decorator.js';
import type { FastifyMultipartFile } from '#/common/interceptors/multipart-file.interceptor.js';
import type { AuthenticatedRequest } from '#/auth/interface/payload.interface.js';

@ApiTags('Posts')
@ApiAuthenticated()
@Controller('posts')
@UseGuards(Auth)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
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
  @Throttle({
    default: { limit: 3, ttl: seconds(1), blockDuration: minutes(5) },
  })
  @UseInterceptors(new MultipartFileInterceptor('file'))
  async createPost(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files: FastifyMultipartFile[],
  ) {
    return this.postsService.create(dto, req.auth.sub, files);
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

  @ApiListLikes()
  @Get('/:id/likes')
  async getPostLikes(@Param('id') id: string) {
    return this.postsService.findLikesByPost(id);
  }

  @ApiCommentPost()
  @Throttle({
    default: { limit: 3, ttl: seconds(1), blockDuration: minutes(5) },
  })
  @Post('/:id/comments')
  async createComment(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(id, req.auth.sub, dto);
  }

  @ApiListComments()
  @Get('/:id/comments')
  async getComments(@Param('id') id: string) {
    return this.commentsService.findByPost(id);
  }

  @ApiUpdateComment()
  @Throttle({
    default: { limit: 3, ttl: seconds(1), blockDuration: minutes(5) },
  })
  @Patch('/:id/comments/:commentId')
  async updateComment(
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, req.auth.sub, dto);
  }

  @ApiDeleteComment()
  @Delete('/:id/comments/:commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.delete(commentId, req.auth.sub);
  }

  @ApiUpdatePost()
  @Patch('/:id')
  async updatePost(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, req.auth.sub, dto);
  }

  @ApiDeletePost()
  @Delete('/:id')
  async deletePost(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.postsService.delete(id, req.auth.sub);
  }
}
