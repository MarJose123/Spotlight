/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CredentialDto {
  @ApiProperty({
    description: 'Email of the user.',
    format: 'email',
    example: 'jane.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Password of the user.',
    format: 'password',
    minLength: 8,
    maxLength: 72,
    example: 'correct-horse-battery',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
