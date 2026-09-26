/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { HttpCode, HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { PostResponseDto } from '@/posts/dto/post-response.dto';
import { LikePostByIdDto } from '@/posts/dto/like-post.dto';
import { PostLikeResponseDto } from '@/common/dto/post-like-response.dto';
import { PresignedUrlResponseDto } from '@/bucket/dto/presigned-url-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';

/** Shared by both like endpoints, which respond identically. */
const likeResponse = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'The like state and the updated post.',
      type: PostLikeResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'The post does not exist.',
      type: ErrorResponseDto,
    }),
    ApiTooManyRequestsResponse({
      description: 'Too many like requests.',
      type: ErrorResponseDto,
    }),
    HttpCode(HttpStatus.OK),
  );

export const ApiListPosts = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List posts',
      description: 'Return a paginated list of every post, newest first.',
    }),
    ApiPaginatedResponse(PostResponseDto, 'Paginated list of posts.'),
  );

export const ApiListUserPosts = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List posts by user',
      description: 'Return a paginated list of the posts authored by a user.',
    }),
    ApiParam({
      name: 'id',
      description: 'Id of the user whose posts should be returned.',
      format: 'uuid',
    }),
    ApiPaginatedResponse(
      PostResponseDto,
      "Paginated list of the user's posts.",
    ),
  );

export const ApiCreatePost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create post',
      description: 'Create a new post.',
    }),
    ApiCreatedResponse({
      description: 'The post has been created.',
      type: PostResponseDto,
    }),
  );

export const ApiLikePost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Like or unlike a post',
      description:
        'Toggle the like of `userId` on `postId`. Returns the post with the updated like count.',
    }),
    likeResponse(),
  );

export const ApiLikePostById = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Like or unlike a post by id',
      description:
        'Toggle a like on the post identified by the path parameter. Returns the post with the updated like count.',
    }),
    ApiParam({
      name: 'id',
      description: 'Id of the post to like or unlike.',
      format: 'uuid',
    }),
    ApiBody({ type: LikePostByIdDto }),
    likeResponse(),
  );

export const ApiPresignedUpload = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Generate a pre-signed upload URL',
      description:
        'Return a pre-signed URL the client can `PUT` an attachment to, together with the object key it will be stored under.',
    }),
    ApiOkResponse({
      description: 'Pre-signed upload URL generated.',
      type: PresignedUrlResponseDto,
    }),
    HttpCode(HttpStatus.OK),
  );
