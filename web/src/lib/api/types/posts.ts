/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

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
	/** Tiptap JSON for rich text rendering. */
	contentJson: string;
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

export interface CreatePostRequest {
	/** Tiptap JSON for rich text rendering. */
	contentJson: string;
	attachmentType: "text" | "image" | "video" | "gif";
	/** GIF URL — required when attachmentType is gif. */
	gifUrl?: string;
	/** Files to upload — required for image and video; ignored for gif and text. */
	files?: File[];
}

export interface UpdatePostRequest {
	/** Tiptap JSON for rich text rendering. */
	contentJson: string;
}
