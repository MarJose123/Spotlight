/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({
    description: "URL of the user's avatar image.",
    format: 'uri',
    nullable: true,
    example: 'https://cdn.example.com/avatars/jane.png',
  })
  @IsOptional()
  @IsString()
  avatar: string | undefined;

  @ApiPropertyOptional({
    description: 'Unique handle for the user.',
    nullable: true,
    example: 'jane.doe',
  })
  @IsOptional()
  @IsString()
  username: string | undefined;

  @ApiProperty({
    description: 'Display name of the user.',
    maxLength: 100,
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Email address used to sign in.',
    format: 'email',
    example: 'jane.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Plain-text password (hashed before storage).',
    format: 'password',
    minLength: 8,
    maxLength: 72,
    example: 'correct-horse-battery',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
