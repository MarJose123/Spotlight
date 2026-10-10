/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { describe, expect, it } from "vitest";
import {
	comments,
	currentUser,
	gifsSearch,
	gifsTrending,
	leaderboard,
	postLikes,
	posts,
	profileStats,
	profileStatsAll,
	userPosts,
	users,
	usersDirectory,
} from "#/lib/query-keys.js";

describe("posts", () => {
	it("returns ['posts']", () => {
		expect(posts()).toEqual(["posts"]);
	});

	it("returns the same array structure on repeated calls", () => {
		expect(posts()).toEqual(posts());
	});
});

describe("currentUser", () => {
	it("returns ['currentUser']", () => {
		expect(currentUser()).toEqual(["currentUser"]);
	});
});

describe("comments", () => {
	it("returns ['comments', postId]", () => {
		expect(comments("post-1")).toEqual(["comments", "post-1"]);
	});

	it("includes the postId in the key", () => {
		expect(comments("abc-123")).toEqual(["comments", "abc-123"]);
	});

	it("produces different keys for different post IDs", () => {
		expect(comments("post-1")).not.toEqual(comments("post-2"));
	});
});

describe("postLikes", () => {
	it("returns ['postLikes', postId]", () => {
		expect(postLikes("post-1")).toEqual(["postLikes", "post-1"]);
	});

	it("produces different keys for different post IDs", () => {
		expect(postLikes("a")).not.toEqual(postLikes("b"));
	});
});

describe("leaderboard", () => {
	it("returns ['leaderboard']", () => {
		expect(leaderboard()).toEqual(["leaderboard"]);
	});
});

describe("profileStats", () => {
	it("returns ['profileStats', userId]", () => {
		expect(profileStats("user-1")).toEqual(["profileStats", "user-1"]);
	});

	it("produces different keys for different user IDs", () => {
		expect(profileStats("u1")).not.toEqual(profileStats("u2"));
	});
});

describe("profileStatsAll", () => {
	it("returns ['profileStats'] without a userId", () => {
		expect(profileStatsAll()).toEqual(["profileStats"]);
	});

	it("differs from profileStats with a userId", () => {
		expect(profileStatsAll()).not.toEqual(profileStats("user-1"));
	});
});

describe("gifsTrending", () => {
	it("returns ['gifs', 'trending']", () => {
		expect(gifsTrending()).toEqual(["gifs", "trending"]);
	});
});

describe("gifsSearch", () => {
	it("returns ['gifs', 'search', query]", () => {
		expect(gifsSearch("cats")).toEqual(["gifs", "search", "cats"]);
	});

	it("produces different keys for different queries", () => {
		expect(gifsSearch("cats")).not.toEqual(gifsSearch("dogs"));
	});

	it("handles empty query", () => {
		expect(gifsSearch("")).toEqual(["gifs", "search", ""]);
	});
});

describe("users", () => {
	it("returns ['users']", () => {
		expect(users()).toEqual(["users"]);
	});
});

describe("usersDirectory", () => {
	it("returns ['usersDirectory', role, search]", () => {
		expect(usersDirectory("admin", "john")).toEqual([
			"usersDirectory",
			"admin",
			"john",
		]);
	});

	it("handles undefined role and search", () => {
		expect(usersDirectory()).toEqual(["usersDirectory", undefined, undefined]);
	});

	it("handles only role", () => {
		expect(usersDirectory("user")).toEqual([
			"usersDirectory",
			"user",
			undefined,
		]);
	});

	it("handles only search", () => {
		expect(usersDirectory(undefined, "john")).toEqual([
			"usersDirectory",
			undefined,
			"john",
		]);
	});
});

describe("userPosts", () => {
	it("returns ['userPosts', userId]", () => {
		expect(userPosts("user-1")).toEqual(["userPosts", "user-1"]);
	});

	it("produces different keys for different user IDs", () => {
		expect(userPosts("u1")).not.toEqual(userPosts("u2"));
	});
});
