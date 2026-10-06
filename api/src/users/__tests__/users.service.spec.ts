/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '#/users/users.service.js';
import { User } from '#/users/entities/user.entity.js';
import type { UserResponseDto } from '#/users/dto/user-response.dto.js';
import { UserStatus } from '#/users/enums/status.enum.js';
import { UserRole } from '#/users/enums/role.enum.js';
import { MailerService } from '#/mailer/mailer.service.js';
import { ConfigService } from '@nestjs/config';

// Mock MikroORM wrap() so wrap(entity).assign(patch) works in tests
vi.mock('@mikro-orm/core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    wrap: vi.fn((entity) => ({
      assign: vi.fn((data) => {
        Object.assign(entity, data);
      }),
    })),
  };
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let em: any;
  let mailer: MailerService;
  let config: ConfigService;
  let userMapper: any;
  let bucketService: any;

  const makeUser = (overrides = {}): User => {
    const user = new User();
    Object.assign(user, {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      status: UserStatus.ACTIVE,
      type: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
    return user;
  };

  const makeActor = (overrides = {}): UserResponseDto => ({
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin',
    displayName: 'Admin',
    username: 'admin',
    status: UserStatus.ACTIVE,
    role: UserRole.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const mockUserRepo = () => ({
    findOne: vi.fn(),
    findOneOrFail: vi.fn(),
    findAndCount: vi.fn(),
    create: vi.fn(),
    nativeDelete: vi.fn(),
  });

  const mockEm = () => ({
    flush: vi.fn(() => Promise.resolve()),
    nativeDelete: vi.fn(() => Promise.resolve([])),
    getReference: vi.fn((entity, id) => ({ __entity: entity, __ref: id })),
  });

  const mockMailer = () => ({
    send: vi.fn(() => Promise.resolve()),
  });

  const mockConfig = () => ({
    getOrThrow: vi.fn((key: string) => {
      if (key === 'app.url') return 'http://localhost:5173';
      if (key === 'app.name') return 'Spotlight';
      return undefined;
    }),
  });

  const mockUserMapper = () => ({
    toResponse: vi.fn((user) => {
      if (!user) return null;
      return {
        id: user.id,
        avatarUrl: user.avatar
          ? `/api/v1/posts/attachment/${encodeURIComponent(user.avatar)}`
          : undefined,
        email: user.email,
        name: user.name,
        username: user.username,
        displayName: user.name,
        status: user.status,
        role: user.type,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }),
  });

  const mockBucketService = () => ({
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository = mockUserRepo();
    em = mockEm();
    mailer = mockMailer() as unknown as MailerService;
    config = mockConfig() as unknown as ConfigService;
    userMapper = mockUserMapper();
    bucketService = mockBucketService();
    service = new UsersService(
      userRepository,
      em,
      mailer,
      config,
      userMapper,
      bucketService,
    );
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [makeUser({ id: 'a' }), makeUser({ id: 'b' })];
      userRepository.findAndCount.mockResolvedValue([users, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.perPage).toBe(10);
      expect(userRepository.findAndCount).toHaveBeenCalledWith(
        {},
        { offset: 0, limit: 10, orderBy: { createdAt: 'desc' } },
      );
    });

    it('should compute skip from page and limit', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ page: 3, limit: 5 });
      expect(userRepository.findAndCount).toHaveBeenCalledWith(
        {},
        { offset: 10, limit: 5, orderBy: { createdAt: 'desc' } },
      );
    });
  });

  describe('findById', () => {
    it('should return the user when found', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findById('user-123');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('user-123');
      expect(result!.email).toBe('test@example.com');
    });

    it('should throw NotFoundException when not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return the user when found', async () => {
      const user = makeUser();
      userRepository.findOneOrFail.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(result!.email).toBe('test@example.com');
    });
  });

  describe('create', () => {
    it('should create a user with a hashed password', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.create({
        name: 'New User',
        email: 'new@example.com',
        password: 'secret123',
      });

      expect(userRepository.create).toHaveBeenCalled();
      expect(em.flush).toHaveBeenCalled();
      expect(mailer.send).toHaveBeenCalled();
      expect(result!.name).toBe('New User');
    });

    it('should create a user without a password', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.create({
        name: 'Sso User',
        email: 'sso@example.com',
      });

      expect(result!.name).toBe('Sso User');
    });

    it('should throw ConflictException for duplicate email', async () => {
      userRepository.findOne.mockResolvedValue(makeUser());

      await expect(
        service.create({
          name: 'Dup',
          email: 'test@example.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update the user fields', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValue(user);

      await service.update('user-123', {
        name: 'Updated Name',
      });

      expect(user.name).toBe('Updated Name');
    });

    it('should throw NotFoundException for unknown id', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'Nope' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException for duplicate email', async () => {
      const user = makeUser();
      userRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(
          makeUser({ id: 'other', email: 'new@example.com' }),
        );

      await expect(
        service.update('user-123', { email: 'new@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivateUser', () => {
    it('should set status to INACTIVE and remove refresh tokens', async () => {
      const user = makeUser();
      userRepository.findOneOrFail.mockResolvedValue(user);

      const result = await service.deactivateUser('user-123', makeActor());

      expect(user.status).toBe(UserStatus.INACTIVE);
      expect(em.nativeDelete).toHaveBeenCalled();
      expect(result!.status).toBe(UserStatus.INACTIVE);
    });

    it('should forbid self-deactivation', async () => {
      userRepository.findOneOrFail.mockResolvedValue(makeUser());

      await expect(
        service.deactivateUser(
          'user-123',
          makeActor({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test',
            role: UserRole.USER,
          }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('activateUser', () => {
    it('should activate an inactive user', async () => {
      const user = makeUser({ status: UserStatus.INACTIVE });
      userRepository.findOneOrFail.mockResolvedValue(user);

      const result = await service.activateUser('user-123', makeActor());

      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(result!.status).toBe(UserStatus.ACTIVE);
    });

    it('should forbid self-activation', async () => {
      userRepository.findOneOrFail.mockResolvedValue(makeUser());

      await expect(
        service.activateUser(
          'user-123',
          makeActor({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test',
            role: UserRole.USER,
          }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateUserRole', () => {
    it('should update the user role', async () => {
      const user = makeUser();
      userRepository.findOneOrFail.mockResolvedValue(user);

      const result = await service.updateUserRole(
        'user-123',
        { role: UserRole.ADMIN },
        makeActor(),
      );

      expect(user.type).toBe(UserRole.ADMIN);
      expect(result!.role).toBe(UserRole.ADMIN);
    });

    it('should forbid self-role-update', async () => {
      userRepository.findOneOrFail.mockResolvedValue(makeUser());

      await expect(
        service.updateUserRole(
          'user-123',
          { role: UserRole.ADMIN },
          makeActor({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test',
            role: UserRole.USER,
          }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete the user', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValue(user);

      await service.delete('user-123');

      expect(userRepository.nativeDelete).toHaveBeenCalledWith({
        id: 'user-123',
      });
    });

    it('should throw NotFoundException for unknown id', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
