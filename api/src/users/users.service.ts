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
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from '#/users/dto/create-user.dto.js';
import { UpdateUserDto } from '#/users/dto/update-user.dto.js';
import { User } from '#/users/entities/user.entity.js';
import { PaginationQueryDto } from '#/common/dto/pagination/pagination-query.dto.js';
import { PaginationResponseDto } from '#/common/dto/pagination/pagination-response.dto.js';
import bcrypt from 'bcrypt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UserMapper } from '#/users/mappers/user.mapper.js';
import { UserResponseDto } from '#/users/dto/user-response.dto.js';
import { MailerService } from '#/mailer/mailer.service.js';
import WelcomeEmail, {
  WelcomeEmailProps,
} from '#/mailer/emails/welcome-email.js';
import { UserStatus } from '#/users/enums/status.enum.js';
import { UpdateUserRoleDto } from '#/users/dto/update-user-role.dto.js';
import { RefreshToken } from '#/auth/entities/refresh-token.entity.js';
import { BucketService } from '#/bucket/bucket.service.js';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';
import type { FastifyMultipartFile } from '#/common/interceptors/multipart-file.interceptor.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    private readonly userMapper: UserMapper,
    private readonly bucketService: BucketService,
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

    const dataTransformed = data.map((user) =>
      this.userMapper.toResponse(user),
    );

    return new PaginationResponseDto(dataTransformed, total, page, limit);
  }

  /** Returns a single user by id, or throws 404. */
  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.userMapper.toResponse(user);
  }

  /** Returns a single user by email or null when it does not exist. */
  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOneOrFail({ email });
    return this.userMapper.toResponse(user);
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

    // Auto-generate a unique username from the user's name.
    user.username = await this.generateUsername(dto.name);

    this.userRepository.create(user);
    await this.flushOrConflict();

    await this.sendWelcomeEmail(user, invitedBy);

    return this.userMapper.toResponse(user);
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
    return this.userMapper.toResponse(user);
  }

  async deactivateUser(
    id: string,
    authenticatedUser: UserResponseDto,
  ): Promise<UserResponseDto | null> {
    if (authenticatedUser.id === id) {
      throw new ForbiddenException(
        'You cannot deactivate yourself. Goto your profile to deactivate.',
      );
    }

    const user = await this.userRepository.findOneOrFail(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    user.status = UserStatus.INACTIVE;

    // remove any refresh tokens
    await this.em.nativeDelete(RefreshToken, { userId: user.id });

    await this.em.flush();

    return this.userMapper.toResponse(user);
  }

  async activateUser(
    id: string,
    authenticatedUser: UserResponseDto,
  ): Promise<UserResponseDto | null> {
    if (authenticatedUser.id === id) {
      throw new ForbiddenException(
        'You cannot activate yourself. Contact an administrator.',
      );
    }

    const user = await this.userRepository.findOneOrFail(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    user.status = UserStatus.ACTIVE;
    await this.em.flush();

    return this.userMapper.toResponse(user);
  }

  async updateUserRole(
    id: string,
    dto: UpdateUserRoleDto,
    authenticatedUser: UserResponseDto,
  ) {
    if (authenticatedUser.id === id) {
      throw new ForbiddenException('You cannot update your own role.');
    }

    const user = await this.userRepository.findOneOrFail(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    user.type = dto.role;
    await this.em.flush();

    return this.userMapper.toResponse(user);
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
   * Uploads a profile avatar image for the given user.
   */
  async uploadAvatar(
    userId: string,
    file: FastifyMultipartFile,
  ): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // Delete the old avatar if one exists
    if (user.avatar) {
      await this.bucketService.deleteFile(user.avatar);
    }

    const key = await this.bucketService.uploadFile(file, AttachmentType.IMAGE);
    user.avatar = key;
    await this.em.flush();

    return this.userMapper.toResponse(user);
  }

  /**
   * Generates a unique username from a display name.  Starts with the
   * slugified name and appends a short random suffix only when the base is
   * already taken.
   */
  private async generateUsername(name: string): Promise<string> {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    if (!base) {
      // Fallback when the name contains no alphanumeric characters.
      return 'user-' + this.randomSuffix();
    }

    // Try the base name first, then append a short random suffix.
    for (let i = 0; i < 5; i++) {
      const candidate = i === 0 ? base : `${base}-${this.randomSuffix()}`;
      const existing = await this.userRepository.findOne({
        username: candidate,
      });
      if (!existing) {
        return candidate;
      }
    }

    // Extremely unlikely: fall back to a fully random suffix.
    return `${base}-${crypto.randomUUID().slice(0, 6)}`;
  }

  private randomSuffix(): string {
    // 4-character alphanumeric suffix: ~1.4 million combinations.
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
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
