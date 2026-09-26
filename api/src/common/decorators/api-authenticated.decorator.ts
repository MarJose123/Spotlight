/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

/**
 * Documents a controller or route as requiring a bearer token.
 *
 * Applied at controller level, so individual routes only add what is specific
 * to them. Routes that opt out (`@Public`) would need their own handling.
 */
export const ApiAuthenticated = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token.',
      type: ErrorResponseDto,
    }),
  );
