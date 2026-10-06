/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { requestJsonAuth } from "./client";

export interface ApiPostAuthor {
	id: string;
	name: string;
	username?: string;
	avatarUrl?: string;
}

export interface ApiAttachment {
	url: string;
	type: string;
}

export interface ApiPost {
	id: string;
	author: ApiPostAuthor;
	content: string;
	attachments: ApiAttachment[];
	postType: string;
	likedBy?: string[];
	likesCount: number;
	commentsCount: number;
	createdAt: string;
}

export interface ApiPaginationMeta {
	total: number;
	itemCount: number;
	perPage: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface ApiPaginatedPosts {
	data: ApiPost[];
	meta: ApiPaginationMeta;
}

export interface FetchPostsParams {
	page?: number;
	limit?: number;
}

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

export interface CreatePostRequest {
	content: string;
	attachmentType: "text" | "image" | "video" | "gif";
	/** GIF URL — required when attachmentType is gif. */
	gifUrl?: string;
	/** Files to upload — required for image and video; ignored for gif and text. */
	files?: File[];
}

export function createPost(params: CreatePostRequest): Promise<unknown> {
	const formData = new FormData();
	formData.append("content", params.content);
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
