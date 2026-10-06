/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersController } from '#/users/users.controller.js';
import { UsersService } from '#/users/users.service.js';
import { PaginationResponseDto } from '#/common/dto/pagination/pagination-response.dto.js';
import type { AuthenticatedUserDto } from '#/auth/dto/authenticated-user.dto.js';
import type { UserResponseDto } from '#/users/dto/user-response.dto.js';
import { UserStatus } from '#/users/enums/status.enum.js';
import { UserRole } from '#/users/enums/role.enum.js';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = () => ({
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivateUser: vi.fn(),
    activateUser: vi.fn(),
    updateUserRole: vi.fn(),
    delete: vi.fn(),
    uploadAvatar: vi.fn(),
  });

  const makeUserResponse = (overrides = {}): UserResponseDto => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    displayName: 'Test User',
    username: 'testuser',
    status: UserStatus.ACTIVE,
    role: UserRole.USER,
    avatarUrl: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const makeAuth = (overrides = {}): AuthenticatedUserDto => ({
    sub: 'admin-1',
    iat: Date.now(),
    exp: Date.now() + 300,
    user: makeUserResponse({ id: 'admin-1', role: UserRole.ADMIN }),
    ...overrides,
  });

  const makeReq = (auth: AuthenticatedUserDto) => ({
    auth,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    usersService = mockUsersService() as unknown as UsersService;
    controller = new UsersController(usersService);
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginationResult = new PaginationResponseDto(
        [makeUserResponse({ id: 'a' }), makeUserResponse({ id: 'b' })],
        2,
        1,
        10,
      );
      vi.mocked(usersService.findAll).mockResolvedValue(paginationResult);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toBe(paginationResult);
      expect(usersService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('profile', () => {
    it('should return the authenticated user from the request', async () => {
      const auth = makeAuth();
      const req = makeReq(auth);

      const result = await controller.profile(req as never);

      expect(result).toBe(auth);
    });
  });

  describe('findById', () => {
    it('should return the user when found', async () => {
      const user = makeUserResponse();
      vi.mocked(usersService.findById).mockResolvedValue(user);

      const result = await controller.findById('user-123');

      expect(result).toBe(user);
      expect(usersService.findById).toHaveBeenCalledWith('user-123');
    });

    it('should propagate NotFoundException when user is not found', async () => {
      vi.mocked(usersService.findById).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a user with the creator name', async () => {
      const auth = makeAuth();
      const req = makeReq(auth);
      const dto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'secret',
      };
      const created = makeUserResponse({
        id: 'new-1',
        email: 'new@example.com',
      });
      vi.mocked(usersService.create).mockResolvedValue(created);

      const result = await controller.create(dto, req as never);

      expect(result).toBe(created);
      expect(usersService.create).toHaveBeenCalledWith(dto, auth.user.name);
    });

    it('should propagate ConflictException for duplicate email', async () => {
      const auth = makeAuth();
      const req = makeReq(auth);
      vi.mocked(usersService.create).mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(
        controller.create(
          { name: 'Dup', email: 'exists@example.com', password: 'x' },
          req as never,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updated = makeUserResponse({ name: 'Updated Name' });
      vi.mocked(usersService.update).mockResolvedValue(updated);

      const result = await controller.update('user-123', {
        name: 'Updated Name',
      });

      expect(result).toBe(updated);
      expect(usersService.update).toHaveBeenCalledWith('user-123', {
        name: 'Updated Name',
      });
    });

    it('should propagate NotFoundException when updating unknown user', async () => {
      vi.mocked(usersService.update).mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('missing', { name: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate the target user', async () => {
      const auth = makeAuth();
      const req = makeReq(auth);
      const deactivated = makeUserResponse({ status: UserStatus.INACTIVE });
      vi.mocked(usersService.deactivateUser).mockResolvedValue(deactivated);

      const result = await controller.deactivateUser('user-123', req as never);

      expect(result).toBe(deactivated);
      expect(usersService.deactivateUser).toHaveBeenCalledWith(
        'user-123',
        auth.user,
      );
    });
  });

  describe('activateUser', () => {
    it('should activate the target user', async () => {
      const auth = makeAuth();
      const req = makeReq(auth);
      const activated = makeUserResponse({ status: UserStatus.ACTIVE });
      vi.mocked(usersService.activateUser).mockResolvedValue(activated);

      const result = await controller.activateUser('user-123', req as never);

      expect(result).toBe(activated);
      expect(usersService.activateUser).toHaveBeenCalledWith(
        'user-123',
        auth.user,
      );
    });
  });

  describe('updateRole', () => {
    it('should update the user role', async () => {
      const auth = makeAuth();
      const req = makeReq(auth);
      const updated = makeUserResponse({ role: UserRole.ADMIN });
      vi.mocked(usersService.updateUserRole).mockResolvedValue(updated);

      const result = await controller.updateRole(
        'user-123',
        { role: UserRole.ADMIN },
        req as never,
      );

      expect(result).toBe(updated);
      expect(usersService.updateUserRole).toHaveBeenCalledWith(
        'user-123',
        { role: UserRole.ADMIN },
        auth.user,
      );
    });
  });

  describe('remove', () => {
    it('should delete the user', async () => {
      await controller.remove('user-123');

      expect(usersService.delete).toHaveBeenCalledWith('user-123');
    });
  });
});
