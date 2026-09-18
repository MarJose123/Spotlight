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
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { User } from '@/users/entities/user.entity';
import { UsersService } from '@/users/users.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
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

@Controller({
  path: 'users',
  version: '1',
})
@ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query()
    pagination: PaginationQueryDto,
  ): Promise<PaginationResponseDto<User>> {
    return this.usersService.findAll(pagination);
  }

  @ApiResponse({ description: 'Get user by id', type: User })
  @ApiOperation({
    summary: 'Get user by id',
    description: 'Get user based on the supplied ID',
  })
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<User> {
    return this.usersService.findById(id);
  }

  @ApiCreatedResponse({ description: 'User has been created' })
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user',
  })
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<User> {
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
  ): Promise<User> {
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
  ): Promise<User> {
    return this.usersService.remove(id);
  }
}
