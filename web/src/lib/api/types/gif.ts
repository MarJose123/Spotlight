/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

/** Single GIF returned by the backend, proxied from GIPHY. */
export interface GiphyGif {
	id: string;
	title: string;
	/** Fixed-height GIF URL ready for display. */
	url: string;
}

export interface GifSearchResponse {
	data: GiphyGif[];
}

export interface GifPaginationMeta {
	hasNextPage: boolean;
}

export interface GifTrendingResponse {
	data: GiphyGif[];
	meta: GifPaginationMeta;
}
