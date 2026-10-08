/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

export type { EnabledProviders } from "./auth";
export type { ApiComment } from "./comments";
export type {
	GifPaginationMeta,
	GifSearchResponse,
	GifTrendingResponse,
	GiphyGif,
} from "./gif";
export type { ApiLeaderboardEntry, ApiLeaderboardUser } from "./leaderboard";
export type { ApiPostLikeResponse, ApiPostLiker } from "./likes";
export type {
	ApiAttachment,
	ApiPaginatedPosts,
	ApiPaginationMeta,
	ApiPost,
	ApiPostAuthor,
	CreatePostRequest,
	FetchPostsParams,
	UpdatePostRequest,
} from "./posts";
export type { ApiAuthenticatedUser, ApiUser, UserProfileStats } from "./users";
