/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { EntityManager, EntityRepository, wrap } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { User } from '@/users/entities/user.entity';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '@/common/dto/pagination/pagination-response.dto';
import bcrypt from 'bcrypt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UserMapper } from '@/users/mappers/user.mapper';
import { UserResponseDto } from '@/users/dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  /** Returns all users. */
  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<User>> {
    const { page, limit } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount(
      {},
      { offset: skip, limit, orderBy: { createdAt: 'desc' } },
    );

    return new PaginationResponseDto(data, total, page, limit);
  }

  /** Returns a single user by id, or throws 404. */
  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return UserMapper.toResponse(user);
  }

  /** Returns a single user by email or null when it does not exist. */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ email });
  }

  /** Creates and persists a new user from the given DTO. */
  async create(dto: CreateUserDto): Promise<User> {
    const user = new User();
    Object.assign(user, dto, {
      password: bcrypt.hashSync(dto.password, 12),
    });
    this.userRepository.create(user);
    await this.em.flush();
    return user;
  }

  /** Updates the provided fields of an existing user. */
  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto | null> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    // Patch only the keys that were actually provided (class-validator leaves
    // absent optional fields as `undefined`, which MikroORM would reject).
    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    wrap(user).assign(patch);
    await this.em.flush();
    return UserMapper.toResponse(user);
  }

  /** Deletes a user by id and returns the removed user (or throws 404). */
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.userRepository.nativeDelete({ id: user.id });
    await this.em.flush();
  }
}
