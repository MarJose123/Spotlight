/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import type { Dictionary, EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { PostsFactory } from '#/database/factories/PostsFactory.js';
import { faker } from '@faker-js/faker';
import { User } from '#/users/entities/user.entity.js';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';

const GIPHY_API_KEY = process.env.GIPHY_API_KEY ?? '';

async function fetchRandomGif(): Promise<string> {
  if (!GIPHY_API_KEY) {
    return 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif';
  }

  const url = `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    return 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif';
  }

  const json = await response.json();
  return (
    json.data?.images?.fixed_height?.url ??
    'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif'
  );
}

export class PostsSeeder extends Seeder {
  async run(em: EntityManager, context: Dictionary<User[]>): Promise<void> {
    const gifUrl = await fetchRandomGif();
    const factory = new PostsFactory(em);
    for (let i = 0; i < 80; i++) {
      factory.make(1, {
        user: faker.helpers.arrayElement(context.user),
        attachments: [{ url: gifUrl, type: AttachmentType.GIF }],
      });
    }
    await em.flush();
  }
}
