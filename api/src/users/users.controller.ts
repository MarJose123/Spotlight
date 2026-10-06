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
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '#/users/dto/create-user.dto.js';
import { UpdateUserDto } from '#/users/dto/update-user.dto.js';
import { UsersService } from '#/users/users.service.js';
import { Auth } from '#/auth/guard/auth.guard.js';
import { RolesGuard } from '#/auth/guard/roles.guard.js';
import { Roles } from '#/auth/decorators/roles.decorator.js';
import { UserRole } from '#/users/enums/role.enum.js';
import { AuthenticatedUserDto } from '#/auth/dto/authenticated-user.dto.js';
import type { AuthenticatedRequest } from '#/auth/interface/payload.interface.js';
import { PaginationQueryDto } from '#/common/dto/pagination/pagination-query.dto.js';
import { PaginationResponseDto } from '#/common/dto/pagination/pagination-response.dto.js';
import { UserResponseDto } from '#/users/dto/user-response.dto.js';
import { ApiAuthenticated } from '#/common/decorators/api-authenticated.decorator.js';
import {
  ApiCreateUser,
  ApiCurrentUser,
  ApiDeactivateUser,
  ApiDeleteUser,
  ApiGetUser,
  ApiListUsers,
  ApiUpdateUser,
  ApiUpdateUserRole,
  ApiUploadAvatar,
} from '#/users/decorators/user-api.decorator.js';
import { UpdateUserRoleDto } from '#/users/dto/update-user-role.dto.js';
import { MultipartFileInterceptor } from '#/common/interceptors/multipart-file.interceptor.js';
import { UploadedFiles } from '#/common/decorators/uploaded-files.decorator.js';
import type { FastifyMultipartFile } from '#/common/interceptors/multipart-file.interceptor.js';

@ApiTags('Users')
@ApiAuthenticated()
@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(Auth, RolesGuard)
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
    return req.auth;
  }

  @ApiUploadAvatar()
  @Post('me/avatar')
  @UseInterceptors(new MultipartFileInterceptor('file'))
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() files: FastifyMultipartFile[],
  ): Promise<UserResponseDto | null> {
    if (!files.length) {
      throw new Error('No file uploaded');
    }
    return this.usersService.uploadAvatar(req.auth.sub, files[0]);
  }

  @ApiGetUser()
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto | null> {
    return this.usersService.findById(id);
  }

  @ApiCreateUser()
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto | null> {
    return this.usersService.create(dto, req.auth?.user?.name);
  }

  @ApiUpdateUser()
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto | null> {
    return this.usersService.update(id, dto);
  }

  @ApiDeactivateUser()
  @Roles(UserRole.ADMIN)
  @Patch('/:id/deactivate')
  async deactivateUser(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto | null> {
    return await this.usersService.deactivateUser(id, req.auth.user);
  }

  @ApiDeactivateUser()
  @Roles(UserRole.ADMIN)
  @Patch('/:id/activate')
  async activateUser(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto | null> {
    return await this.usersService.activateUser(id, req.auth.user);
  }

  @ApiUpdateUserRole()
  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  async updateRole(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto | null> {
    return await this.usersService.updateUserRole(id, dto, req.auth.user);
  }

  @ApiDeleteUser()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.usersService.delete(id);
  }
}
