/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Key-value store for all application settings.
 * Examples: monthly points budget, post edit window, comment delete window.
 */
@Entity({ tableName: 'app_settings' })
@Unique({ properties: ['key'] })
export class AppSettings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Unique setting key, e.g. "leaderboard.monthlyPoints". */
  @Property()
  key!: string;

  /** JSON string value — numbers are stored as strings for flexibility. */
  @Property({ type: 'text' })
  value!: string;

  /** Human-readable description for the UI. */
  @Property({ type: 'text' })
  description!: string;

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
