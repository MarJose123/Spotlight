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
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { PostResponseDto } from '#/posts/dto/post-response.dto.js';
import { LikePostByIdDto } from '#/posts/dto/like-post.dto.js';
import { PostLikeResponseDto } from '#/common/dto/post-like-response.dto.js';
import { ErrorResponseDto } from '#/common/dto/error-response.dto.js';
import { ApiPaginatedResponse } from '#/common/decorators/api-paginated-response.decorator.js';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';
import { CreateCommentDto } from '#/posts/dto/create-comment.dto.js';
import { CommentResponseDto } from '#/posts/dto/comment-response.dto.js';
import { UpdatePostDto } from '#/posts/dto/update-post.dto.js';

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
      description:
        'Create a new post. Images and videos are uploaded as files (up to 5 images or 1 video). GIFs are provided as a URL link (1 GIF).',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          content: { type: 'string', example: 'Thanks for the help!' },
          user: { type: 'string', format: 'uuid' },
          file: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description:
              'Attached files — required for IMAGE and VIDEO; omit for GIF',
          },
          attachmentType: {
            type: 'string',
            enum: Object.values(AttachmentType),
            description: 'The type of attachment — IMAGE, VIDEO, or GIF',
          },
          gifUrl: {
            type: 'string',
            format: 'uri',
            description:
              'GIF URL — required when attachmentType is GIF; ignored otherwise',
            example: 'https://media.giphy.com/media/abc123/giphy.gif',
          },
        },
        required: ['content', 'user', 'attachmentType'],
      },
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

export const ApiCommentPost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Comment on a post',
      description:
        'Create a comment on the post identified by the path parameter.',
    }),
    ApiParam({
      name: 'id',
      description: 'Id of the post to comment on.',
      format: 'uuid',
    }),
    ApiBody({ type: CreateCommentDto }),
    ApiCreatedResponse({
      description: 'The comment has been created.',
      type: CommentResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'The post does not exist.',
      type: ErrorResponseDto,
    }),
    ApiTooManyRequestsResponse({
      description: 'Too many comment requests.',
      type: ErrorResponseDto,
    }),
  );

export const ApiListComments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List comments',
      description: 'Return all comments for a post, newest first.',
    }),
    ApiParam({
      name: 'id',
      description: 'Id of the post whose comments should be returned.',
      format: 'uuid',
    }),
    ApiOkResponse({
      description: 'List of comments.',
      type: [CommentResponseDto],
    }),
    ApiNotFoundResponse({
      description: 'The post does not exist.',
      type: ErrorResponseDto,
    }),
  );

export const ApiUpdatePost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update post',
      description:
        'Update the content of a post. Only the author may edit, and only within 15 minutes of creation.',
    }),
    ApiParam({
      name: 'id',
      description: 'Id of the post to update.',
      format: 'uuid',
    }),
    ApiBody({ type: UpdatePostDto }),
    ApiOkResponse({
      description: 'The updated post.',
      type: PostResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'The post does not exist.',
      type: ErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description:
        'The request is not from the author or the 15-minute window has passed.',
      type: ErrorResponseDto,
    }),
  );

export const ApiDeletePost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete post',
      description:
        'Delete a post. Only the author may delete, and only within 15 minutes of creation.',
    }),
    ApiParam({
      name: 'id',
      description: 'Id of the post to delete.',
      format: 'uuid',
    }),
    ApiNoContentResponse({
      description: 'The post has been deleted.',
    }),
    ApiNotFoundResponse({
      description: 'The post does not exist.',
      type: ErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description:
        'The request is not from the author or the 15-minute window has passed.',
      type: ErrorResponseDto,
    }),
  );
