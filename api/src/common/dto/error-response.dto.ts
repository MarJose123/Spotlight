/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Shape of every non-2xx response produced by the API.
 *
 * `message` is a flat string for most errors, but a field-keyed map for
 * request-validation failures (see the `ValidationPipe` in `main.ts`).
 */
export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code.', example: 400 })
  statusCode: number;

  @ApiProperty({
    description:
      'Human readable error message, or a map of field name to validation errors.',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
      {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    ],
    example: { content: ['content should not be empty'] },
  })
  message: string | string[] | Record<string, string[]>;

  @ApiPropertyOptional({
    description: 'Short error label. Omitted by some framework errors.',
    example: 'Bad Request',
  })
  error: string;
}
