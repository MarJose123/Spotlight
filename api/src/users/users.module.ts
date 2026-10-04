/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '#/users/entities/user.entity.js';
import { UsersController } from '#/users/users.controller.js';
import { UsersService } from '#/users/users.service.js';
import { AuthModule } from '#/auth/auth.module.js';
import { MailerModule } from '#/mailer/mailer.module.js';

@Module({
  imports: [AuthModule, MailerModule, MikroOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
