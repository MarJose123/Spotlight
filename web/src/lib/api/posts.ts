/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { requestJsonAuth } from "./client";
import type {
	ApiPaginatedPosts,
	ApiPost,
	CreatePostRequest,
	FetchPostsParams,
	UpdatePostRequest,
} from "./types/posts";

export type {
	ApiAttachment,
	ApiPaginatedPosts,
	ApiPaginationMeta,
	ApiPost,
	ApiPostAuthor,
	CreatePostRequest,
	FetchPostsParams,
	UpdatePostRequest,
} from "./types/posts";

export async function fetchPosts(
	params: FetchPostsParams = {},
): Promise<ApiPaginatedPosts> {
	const search = new URLSearchParams();
	if (params.page) search.set("page", String(params.page));
	if (params.limit) search.set("limit", String(params.limit));
	const query = search.toString();
	const path = query ? `/posts?${query}` : "/posts";
	return requestJsonAuth<ApiPaginatedPosts>(path, {
		headers: { accept: "application/json" },
	});
}

export function createPost(params: CreatePostRequest): Promise<unknown> {
	const formData = new FormData();
	formData.append("contentJson", params.contentJson);
	formData.append("attachmentType", params.attachmentType);

	if (params.attachmentType === "gif" && params.gifUrl) {
		formData.append("gifUrl", params.gifUrl);
	} else if (params.files) {
		for (const file of params.files) {
			formData.append("file", file);
		}
	}

	return requestJsonAuth<unknown>("/posts", {
		method: "POST",
		headers: { accept: "application/json" },
		body: formData,
	});
}

/** Fetch the total number of posts by a user, without loading the posts themselves. */
export async function fetchUserPostsCount(userId: string): Promise<number> {
	const result = await requestJsonAuth<ApiPaginatedPosts>(
		`/posts/user/${encodeURIComponent(userId)}?limit=1`,
		{ headers: { accept: "application/json" } },
	);
	return result.meta.total;
}

export async function updatePost(
	postId: string,
	params: UpdatePostRequest,
): Promise<ApiPost> {
	return requestJsonAuth<ApiPost>(`/posts/${encodeURIComponent(postId)}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json", accept: "application/json" },
		body: JSON.stringify(params),
	});
}

export async function deletePost(postId: string): Promise<void> {
	return requestJsonAuth<void>(`/posts/${encodeURIComponent(postId)}`, {
		method: "DELETE",
		headers: { accept: "application/json" },
	});
}
