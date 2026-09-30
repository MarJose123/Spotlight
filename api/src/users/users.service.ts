/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  EntityManager,
  EntityRepository,
  UniqueConstraintViolationException,
  wrap,
} from '@mikro-orm/core';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { User } from '@/users/entities/user.entity';
import { PaginationQueryDto } from '@/common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '@/common/dto/pagination/pagination-response.dto';
import bcrypt from 'bcrypt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UserMapper } from '@/users/mappers/user.mapper';
import { UserResponseDto } from '@/users/dto/user-response.dto';
import { MailerService } from '@/mailer/mailer.service';
import WelcomeEmail, { WelcomeEmailProps } from '@/mailer/emails/welcome-email';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  /** Returns all users. */
  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResponseDto<UserResponseDto | null>> {
    const { page, limit } = paginationQuery;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount(
      {},
      { offset: skip, limit, orderBy: { createdAt: 'desc' } },
    );

    const dataTransformed = data.map((user) => UserMapper.toResponse(user));

    return new PaginationResponseDto(dataTransformed, total, page, limit);
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
  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOneOrFail({ email });
    return UserMapper.toResponse(user);
  }

  /** Creates and persists a new user, then welcomes them by email. */
  async create(
    dto: CreateUserDto,
    invitedBy?: string,
  ): Promise<UserResponseDto | null> {
    await this.assertUnique({ email: dto.email });

    const { password, ...profile } = dto;
    const user = new User();
    Object.assign(user, profile, {
      password: password ? bcrypt.hashSync(password, 12) : undefined,
    });

    this.userRepository.create(user);
    await this.flushOrConflict();

    await this.sendWelcomeEmail(user, invitedBy);

    return UserMapper.toResponse(user);
  }

  /** Updates the provided fields of an existing user. */
  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.assertUnique({
      email: dto.email,
      username: dto.username,
      excludeId: id,
    });

    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as Partial<User>;
    if (typeof patch.password === 'string') {
      patch.password = bcrypt.hashSync(patch.password, 12);
    }
    wrap(user).assign(patch);
    await this.flushOrConflict();
    return UserMapper.toResponse(user);
  }

  /** Deletes a user by id and returns the removed user (or throws 404). */
  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.userRepository.nativeDelete({ id: user.id });
    await this.em.flush();
  }

  /**
   * Throws a 409 when the supplied email or username is already taken.
   */
  private async assertUnique({
    email,
    username,
    excludeId,
  }: {
    email?: string;
    username?: string;
    excludeId?: string;
  }): Promise<void> {
    const isTaken = async (where: { email?: string; username?: string }) =>
      Boolean(
        await this.userRepository.findOne(
          excludeId ? { ...where, id: { $ne: excludeId } } : where,
        ),
      );

    if (email && (await isTaken({ email }))) {
      throw new ConflictException('A user with this email already exists.');
    }
    if (username && (await isTaken({ username }))) {
      throw new ConflictException('A user with this username already exists.');
    }
  }

  private async flushOrConflict(): Promise<void> {
    try {
      await this.em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'A user with the same email or username already exists.',
        );
      }
      throw error;
    }
  }

  /**
   * Sends the welcome email for a freshly created account.
   */
  private async sendWelcomeEmail(
    user: User,
    invitedBy?: string,
  ): Promise<void> {
    try {
      const signInUrl = `${this.config.getOrThrow<string>('app.url')}/signin`;

      await this.mailer.send<WelcomeEmailProps>({
        template: WelcomeEmail,
        props: { name: user.name, signInUrl, invitedBy },
        to: user.email,
        subject: `Welcome to ${this.config.getOrThrow<string>('app.name')}`,
      });
    } catch (error) {
      this.logger.error(
        `Welcome email for user ${user.id} could not be delivered to ${user.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
