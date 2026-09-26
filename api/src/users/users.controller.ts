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
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UsersService } from '@/users/users.service';
import { Auth } from '@/auth/guard/auth.guard';
import { AuthenticatedUserDto } from '@/auth/dto/authenticated-user.dto';
import type { AuthenticatedRequest } from '@/auth/interface/payload.interface';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '@/common/dto/pagination/pagination-response.dto';
import { UserResponseDto } from '@/users/dto/user-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token.',
  type: ErrorResponseDto,
})
@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(Auth)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'List users',
    description: 'Return a paginated list of every user, newest first.',
  })
  @ApiPaginatedResponse(UserResponseDto, 'Paginated list of users.')
  @Get()
  findAll(
    @Query()
    pagination: PaginationQueryDto,
  ): Promise<PaginationResponseDto<UserResponseDto | null>> {
    return this.usersService.findAll(pagination);
  }

  @ApiOperation({
    summary: 'Get current user',
    description: 'Profile of the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'The authenticated user and their token claims.',
    type: AuthenticatedUserDto,
  })
  @Get('me')
  async profile(
    @Req() req: AuthenticatedRequest,
  ): Promise<AuthenticatedUserDto | null> {
    return req.user;
  }

  @ApiOperation({
    summary: 'Get user by id',
    description: 'Get a single user based on the supplied id.',
  })
  @ApiParam({ name: 'id', description: 'Id of the user.', format: 'uuid' })
  @ApiOkResponse({
    description: 'The requested user.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No user exists with the supplied id.',
    type: ErrorResponseDto,
  })
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto | null> {
    return this.usersService.findById(id);
  }

  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user.',
  })
  @ApiCreatedResponse({
    description: 'The user has been created.',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'A user with the same email or username already exists.',
    type: ErrorResponseDto,
  })
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto | null> {
    return this.usersService.create(dto);
  }

  @ApiOperation({
    summary: 'Update user',
    description: 'Update the record of an existing user.',
  })
  @ApiParam({ name: 'id', description: 'Id of the user.', format: 'uuid' })
  @ApiOkResponse({
    description: 'The updated user.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No user exists with the supplied id.',
    type: ErrorResponseDto,
  })
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto | null> {
    return this.usersService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete the record of an existing user.',
  })
  @ApiParam({ name: 'id', description: 'Id of the user.', format: 'uuid' })
  @ApiNoContentResponse({ description: 'The record has been deleted.' })
  @ApiNotFoundResponse({
    description: 'No user exists with the supplied id.',
    type: ErrorResponseDto,
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.usersService.delete(id);
  }
}
