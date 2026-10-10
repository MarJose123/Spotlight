/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { describe, expect, it } from "vitest";
import {
	COMPOSER_ACTIONS,
	POSTS,
	SUGGESTED,
	TREND_REGION,
	TRENDS,
	VIEWER,
} from "#/lib/feed-data.js";

describe("VIEWER", () => {
	it("has a valid id", () => {
		expect(typeof VIEWER.id).toBe("string");
		expect(VIEWER.id.length).toBeGreaterThan(0);
	});

	it("has a name", () => {
		expect(typeof VIEWER.name).toBe("string");
		expect(VIEWER.name.length).toBeGreaterThan(0);
	});

	it("has a handle starting with @", () => {
		expect(VIEWER.handle.startsWith("@")).toBe(true);
	});

	it("has a valid tone", () => {
		const validTones = [
			"lagoon",
			"violet",
			"amber",
			"rose",
			"mint",
			"slate",
			"sky",
		];
		expect(validTones).toContain(VIEWER.tone);
	});

	it("has stats array with label and value", () => {
		expect(Array.isArray(VIEWER.stats)).toBe(true);
		expect(VIEWER.stats.length).toBeGreaterThan(0);
		for (const stat of VIEWER.stats) {
			expect(typeof stat.label).toBe("string");
			expect(typeof stat.value).toBe("string");
		}
	});
});

describe("SUGGESTED", () => {
	it("is a non-empty array", () => {
		expect(Array.isArray(SUGGESTED)).toBe(true);
		expect(SUGGESTED.length).toBeGreaterThan(0);
	});

	it("each entry has name, handle, and tone", () => {
		for (const person of SUGGESTED) {
			expect(typeof person.name).toBe("string");
			expect(typeof person.handle).toBe("string");
			expect(person.handle.startsWith("@")).toBe(true);
			expect(typeof person.tone).toBe("string");
		}
	});
});

describe("POSTS", () => {
	it("is a non-empty array", () => {
		expect(Array.isArray(POSTS)).toBe(true);
		expect(POSTS.length).toBeGreaterThan(0);
	});

	it("each post has required fields", () => {
		for (const post of POSTS) {
			expect(typeof post.id).toBe("string");
			expect(typeof post.authorId).toBe("string");
			expect(typeof post.author.name).toBe("string");
			expect(typeof post.author.handle).toBe("string");
			expect(typeof post.createdAt).toBe("string");
			expect(typeof post.time).toBe("string");
			expect(typeof post.contentJson).toBe("string");
			expect(typeof post.reactionCount).toBe("string");
			expect(typeof post.commentCount).toBe("string");
			expect(Array.isArray(post.reactions)).toBe(true);
		}
	});

	it("each post has a valid createdAt ISO string", () => {
		for (const post of POSTS) {
			const date = new Date(post.createdAt);
			expect(Number.isNaN(date.getTime())).toBe(false);
		}
	});

	it("viewer post has authorId matching VIEWER.id", () => {
		const viewerPost = POSTS.find((p) => p.id === "viewer-post");
		expect(viewerPost).toBeDefined();
		expect(viewerPost?.authorId).toBe(VIEWER.id);
	});

	it("verified posts have verified flag set", () => {
		const verifiedPosts = POSTS.filter((p) => p.verified);
		expect(verifiedPosts.length).toBeGreaterThan(0);
	});

	it("brand posts have brand flag set", () => {
		const brandPosts = POSTS.filter((p) => p.brand);
		expect(brandPosts.length).toBeGreaterThan(0);
	});

	it("posts with media have valid media items", () => {
		const postsWithMedia = POSTS.filter(
			(p) => p.mediaItems && p.mediaItems.length > 0,
		);
		for (const post of postsWithMedia) {
			for (const item of post.mediaItems || []) {
				expect(typeof item.alt).toBe("string");
				expect(typeof item.title).toBe("string");
				expect(typeof item.subtitle).toBe("string");
				expect(typeof item.url).toBe("string");
				expect(["image", "video", "gif"]).toContain(item.type);
			}
		}
	});
});

describe("TRENDS", () => {
	it("is a non-empty array", () => {
		expect(Array.isArray(TRENDS)).toBe(true);
		expect(TRENDS.length).toBeGreaterThan(0);
	});

	it("each trend has id, tag, and meta", () => {
		for (const trend of TRENDS) {
			expect(typeof trend.id).toBe("string");
			expect(typeof trend.tag).toBe("string");
			expect(trend.tag.startsWith("#")).toBe(true);
			expect(typeof trend.meta).toBe("string");
		}
	});

	it("some trends have a category", () => {
		const categorized = TRENDS.filter((t) => t.category);
		expect(categorized.length).toBeGreaterThan(0);
		for (const trend of categorized) {
			expect(typeof trend.category).toBe("string");
		}
	});
});

describe("TREND_REGION", () => {
	it("is a non-empty string", () => {
		expect(typeof TREND_REGION).toBe("string");
		expect(TREND_REGION.length).toBeGreaterThan(0);
	});
});

describe("COMPOSER_ACTIONS", () => {
	it("is a non-empty array", () => {
		expect(Array.isArray(COMPOSER_ACTIONS)).toBe(true);
		expect(COMPOSER_ACTIONS.length).toBeGreaterThan(0);
	});

	it("each action has id and label", () => {
		for (const action of COMPOSER_ACTIONS) {
			expect(typeof action.id).toBe("string");
			expect(typeof action.label).toBe("string");
		}
	});

	it("includes photo, video, and gif actions", () => {
		const ids = COMPOSER_ACTIONS.map((a) => a.id);
		expect(ids).toContain("photo");
		expect(ids).toContain("video");
		expect(ids).toContain("gif");
	});
});
