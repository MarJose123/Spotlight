/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { CredentialDto } from './credential.dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Login payload.
 *
 * The password is redeclared without the registration-time length policy:
 * login only needs a non-empty value so that already-issued credentials keep
 * working even if the password rules change later.
 */
export class CredentialLoginDto extends OmitType(CredentialDto, [
  'password',
] as const) {
  @ApiProperty({
    description: 'Password of the user.',
    format: 'password',
    example: 'correct-horse-battery',
  })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
