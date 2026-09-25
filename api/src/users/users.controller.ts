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
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { User } from '@/users/entities/user.entity';
import { UsersService } from '@/users/users.service';
import { Auth } from '@/auth/guard/auth.guard';
import { AuthenticatedUserDto } from '@/auth/dto/authenticated-user.dto';
import type { AuthenticatedRequest } from '@/auth/interface/payload.interface';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '@/common/dto/pagination/pagination-response.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from '@/users/dto/user-response.dto';

@Controller({
  path: 'users',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(Auth)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOkResponse({
    description: 'Get all user',
    type: PaginationResponseDto<User>,
  })
  @ApiOperation({
    summary: 'List of user',
    description: 'Get all the users',
  })
  @Get()
  findAll(
    @Query()
    pagination: PaginationQueryDto,
  ): Promise<PaginationResponseDto<UserResponseDto | null>> {
    return this.usersService.findAll(pagination);
  }

  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Get the authenticated user',
    type: AuthenticatedUserDto,
  })
  @ApiOperation({
    summary: 'Get current user',
    description: 'Profile of the currently authenticated user',
  })
  // Must stay above `@Get(':id')`, otherwise `/users/me` is captured by the
  // `:id` route and rejected by its UUID pipe.
  @Get('me')
  async profile(
    @Req() req: AuthenticatedRequest,
  ): Promise<AuthenticatedUserDto | null> {
    return req.user;
  }

  @ApiResponse({ description: 'Get user by id', type: User })
  @ApiOperation({
    summary: 'Get user by id',
    description: 'Get user based on the supplied ID',
  })
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto | null> {
    return this.usersService.findById(id);
  }

  @ApiCreatedResponse({ description: 'User has been created' })
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user',
  })
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto | null> {
    return this.usersService.create(dto);
  }

  @ApiOperation({
    summary: 'Update user',
    description: 'Update record of the user',
  })
  @ApiOkResponse({ description: 'Record has been updated' })
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto | null> {
    return this.usersService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete record of the user',
  })
  @ApiNoContentResponse({ description: 'Record has been deleted' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.usersService.delete(id);
  }
}
