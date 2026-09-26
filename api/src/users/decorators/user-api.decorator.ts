/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { HttpCode, HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { AuthenticatedUserDto } from '@/auth/dto/authenticated-user.dto';
import { UserResponseDto } from '@/users/dto/user-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';

const idParam = () =>
  ApiParam({ name: 'id', description: 'Id of the user.', format: 'uuid' });

const userNotFound = () =>
  ApiNotFoundResponse({
    description: 'No user exists with the supplied id.',
    type: ErrorResponseDto,
  });

export const ApiListUsers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List users',
      description: 'Return a paginated list of every user, newest first.',
    }),
    ApiPaginatedResponse(UserResponseDto, 'Paginated list of users.'),
  );

export const ApiCurrentUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get current user',
      description: 'Profile of the currently authenticated user.',
    }),
    ApiOkResponse({
      description: 'The authenticated user and their token claims.',
      type: AuthenticatedUserDto,
    }),
  );

export const ApiGetUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get user by id',
      description: 'Get a single user based on the supplied id.',
    }),
    idParam(),
    ApiOkResponse({
      description: 'The requested user.',
      type: UserResponseDto,
    }),
    userNotFound(),
  );

export const ApiCreateUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create user',
      description: 'Create a new user.',
    }),
    ApiCreatedResponse({
      description: 'The user has been created.',
      type: UserResponseDto,
    }),
    ApiConflictResponse({
      description: 'A user with the same email or username already exists.',
      type: ErrorResponseDto,
    }),
  );

export const ApiUpdateUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update user',
      description: 'Update the record of an existing user.',
    }),
    idParam(),
    ApiOkResponse({
      description: 'The updated user.',
      type: UserResponseDto,
    }),
    userNotFound(),
  );

export const ApiDeleteUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete user',
      description: 'Delete the record of an existing user.',
    }),
    idParam(),
    ApiNoContentResponse({ description: 'The record has been deleted.' }),
    userNotFound(),
    HttpCode(HttpStatus.NO_CONTENT),
  );
