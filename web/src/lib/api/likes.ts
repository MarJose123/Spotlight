/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { requestJsonAuth } from "./client";
import type { ApiPost } from "./posts";

export interface ApiPostLikeResponse {
	like: boolean;
	post: ApiPost;
}

export function toggleLikePost(
	postId: string,
	userId: string,
): Promise<ApiPostLikeResponse> {
	return requestJsonAuth<ApiPostLikeResponse>("/posts/like", {
		method: "PUT",
		headers: {
			"content-type": "application/json",
			accept: "application/json",
		},
		body: JSON.stringify({ postId, userId }),
	});
}
