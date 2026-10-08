/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { requestJsonAuth } from "./client";
import type {
	GifSearchResponse,
	GifTrendingResponse,
	GiphyGif,
} from "./types/gif";

export type {
	GifPaginationMeta,
	GifSearchResponse,
	GifTrendingResponse,
	GiphyGif,
} from "./types/gif";

/** Fetch trending GIFs from the backend with pagination. */
export async function fetchTrendingGifs(
	page = 1,
	limit = 25,
): Promise<GifTrendingResponse> {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
	});
	return requestJsonAuth<GifTrendingResponse>(
		`/gifs/trending?${params.toString()}`,
		{ headers: { accept: "application/json" } },
	);
}

/** Search GIFs via the backend proxy. Returns up to 25 results. */
export async function searchGifs(
	query: string,
	limit = 25,
): Promise<GiphyGif[]> {
	if (!query.trim()) {
		return [];
	}

	const params = new URLSearchParams({
		query: query.trim(),
		limit: String(limit),
	});
	const response = await requestJsonAuth<GifSearchResponse>(
		`/gifs?${params.toString()}`,
		{ headers: { accept: "application/json" } },
	);
	return response.data ?? [];
}
