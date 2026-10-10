/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
// ── Client ───────────────────────────────────────────────────────────────────

export {
	ApiError,
	refreshAccessToken,
	requestJson,
	requestJsonAuth,
} from "./client";

// ── Types ────────────────────────────────────────────────────────────────────

export type {
	ApiAttachment,
	ApiAuthenticatedUser,
	ApiComment,
	ApiLeaderboardEntry,
	ApiLeaderboardUser,
	ApiPaginatedPosts,
	ApiPaginationMeta,
	ApiPost,
	ApiPostAuthor,
	ApiPostLikeResponse,
	ApiPostLiker,
	ApiUser,
	CreatePostRequest,
	EnabledProviders,
	FetchPostsParams,
	GifPaginationMeta,
	GifSearchResponse,
	GifTrendingResponse,
	GiphyGif,
	UpdatePostRequest,
	UserProfileStats,
} from "./types";

// ── Auth ─────────────────────────────────────────────────────────────────────

export {
	exchangeAuthorizationCode,
	fetchAuthorizeUrl,
	fetchEnabledProviders,
	loginWithCredentials,
	logout,
} from "./auth";

// ── Posts ────────────────────────────────────────────────────────────────────

export {
	createPost,
	deletePost,
	fetchPosts,
	fetchUserPosts,
	fetchUserPostsCount,
	updatePost,
} from "./posts";

// ── Users ────────────────────────────────────────────────────────────────────

export { fetchCurrentUser, fetchUserProfileStats, fetchUsers } from "./users";

// ── Likes ────────────────────────────────────────────────────────────────────

export { fetchPostLikes, toggleLikePost } from "./likes";

// ── Comments ─────────────────────────────────────────────────────────────────

export {
	createComment,
	deleteComment,
	fetchComments,
	updateComment,
} from "./comments";

// ── Leaderboard ──────────────────────────────────────────────────────────────

export { fetchLeaderboard } from "./leaderboard";
