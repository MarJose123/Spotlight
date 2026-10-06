/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { requestJsonAuth } from "./client";

export interface ApiComment {
	id: string;
	content: string;
	author: {
		id: string;
		name: string;
	};
	createdAt: string;
}

export function fetchComments(postId: string): Promise<ApiComment[]> {
	return requestJsonAuth<ApiComment[]>(
		`/posts/${encodeURIComponent(postId)}/comments`,
		{
			headers: { accept: "application/json" },
		},
	);
}

export function createComment(
	postId: string,
	content: string,
): Promise<ApiComment> {
	return requestJsonAuth<ApiComment>(
		`/posts/${encodeURIComponent(postId)}/comments`,
		{
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			body: JSON.stringify({ content }),
		},
	);
}

export function updateComment(
	postId: string,
	commentId: string,
	content: string,
): Promise<ApiComment> {
	return requestJsonAuth<ApiComment>(
		`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
		{
			method: "PATCH",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			body: JSON.stringify({ content }),
		},
	);
}

export function deleteComment(
	postId: string,
	commentId: string,
): Promise<void> {
	return requestJsonAuth<void>(
		`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
		{
			method: "DELETE",
			headers: { accept: "application/json" },
		},
	);
}
