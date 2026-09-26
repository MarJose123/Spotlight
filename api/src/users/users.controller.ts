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
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UsersService } from '@/users/users.service';
import { Auth } from '@/auth/guard/auth.guard';
import { AuthenticatedUserDto } from '@/auth/dto/authenticated-user.dto';
import type { AuthenticatedRequest } from '@/auth/interface/payload.interface';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '@/common/dto/pagination/pagination-response.dto';
import { UserResponseDto } from '@/users/dto/user-response.dto';
import { ApiAuthenticated } from '@/common/decorators/api-authenticated.decorator';
import {
  ApiCreateUser,
  ApiCurrentUser,
  ApiDeleteUser,
  ApiGetUser,
  ApiListUsers,
  ApiUpdateUser,
} from '@/users/decorators/user-api.decorator';

@ApiTags('Users')
@ApiAuthenticated()
@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(Auth)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiListUsers()
  @Get()
  findAll(
    @Query()
    pagination: PaginationQueryDto,
  ): Promise<PaginationResponseDto<UserResponseDto | null>> {
    return this.usersService.findAll(pagination);
  }

  @ApiCurrentUser()
  @Get('me')
  async profile(
    @Req() req: AuthenticatedRequest,
  ): Promise<AuthenticatedUserDto | null> {
    return req.user;
  }

  @ApiGetUser()
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto | null> {
    return this.usersService.findById(id);
  }

  @ApiCreateUser()
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto | null> {
    return this.usersService.create(dto);
  }

  @ApiUpdateUser()
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto | null> {
    return this.usersService.update(id, dto);
  }

  @ApiDeleteUser()
  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.usersService.delete(id);
  }
}
