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

// ── Auth ─────────────────────────────────────────────────────────────────────

export type { EnabledProviders } from "./auth";
export {
	exchangeAuthorizationCode,
	fetchAuthorizeUrl,
	fetchEnabledProviders,
	loginWithCredentials,
	logout,
} from "./auth";

// ── Posts ────────────────────────────────────────────────────────────────────

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
export {
	createPost,
	deletePost,
	fetchPosts,
	fetchUserPostsCount,
	updatePost,
} from "./posts";

// ── Users ────────────────────────────────────────────────────────────────────

export type {
	ApiAuthenticatedUser,
	ApiUser,
	UserProfileStats,
} from "./users";
export { fetchCurrentUser, fetchUserProfileStats } from "./users";

// ── Likes ────────────────────────────────────────────────────────────────────

export type { ApiPostLikeResponse, ApiPostLiker } from "./likes";
export { fetchPostLikes, toggleLikePost } from "./likes";

// ── Comments ─────────────────────────────────────────────────────────────────

export type { ApiComment } from "./comments";
export {
	createComment,
	deleteComment,
	fetchComments,
	updateComment,
} from "./comments";

// ── Leaderboard ──────────────────────────────────────────────────────────────

export type { ApiLeaderboardEntry, ApiLeaderboardUser } from "./leaderboard";
export { fetchLeaderboard } from "./leaderboard";
