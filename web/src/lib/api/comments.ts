/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { requestJsonAuth } from "./client";
import type { ApiComment } from "./types/comments";

export type { ApiComment } from "./types/comments";

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
	contentJson: string,
): Promise<ApiComment> {
	return requestJsonAuth<ApiComment>(
		`/posts/${encodeURIComponent(postId)}/comments`,
		{
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			body: JSON.stringify({ contentJson }),
		},
	);
}

export function updateComment(
	postId: string,
	commentId: string,
	contentJson: string,
): Promise<ApiComment> {
	return requestJsonAuth<ApiComment>(
		`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
		{
			method: "PATCH",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			body: JSON.stringify({ contentJson }),
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
