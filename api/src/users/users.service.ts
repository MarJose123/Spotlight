import { EntityManager, wrap } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { PaginationQueryDto } from '../common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '../common/dto/pagination/pagination-response.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  /** Returns all users. */
  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<User>> {
    const { page, limit } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.em.findAndCount(
      User,
      {},
      { offset: skip, limit, orderBy: { createdAt: 'desc' } },
    );

    return new PaginationResponseDto(data, total, page, limit);
  }

  /** Returns a single user by id, or throws 404. */
  async findById(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  /** Returns a single user by email or null when it does not exist. */
  async findByEmail(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  /** Creates and persists a new user from the given DTO. */
  async create(dto: CreateUserDto): Promise<User> {
    const user = new User();
    Object.assign(user, dto, {
      password: bcrypt.hashSync(dto.password, 12),
    });
    this.em.persist(user);
    await this.em.flush();
    return user;
  }

  /** Updates the provided fields of an existing user. */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    // Patch only the keys that were actually provided (class-validator leaves
    // absent optional fields as `undefined`, which MikroORM would reject).
    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    wrap(user).assign(patch);
    await this.em.flush();
    return user;
  }

  /** Deletes a user by id and returns the removed user (or throws 404). */
  async remove(id: string): Promise<User> {
    const user = await this.findById(id);
    this.em.remove(user);
    await this.em.flush();
    return user;
  }
}
