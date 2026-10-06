/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

/**
 * Content the feed renders while it is not yet reading from the API. It is
 * deliberately static: swapping in `GET /posts` should only mean replacing where
 * these values come from.
 */

export type AvatarTone =
	| "lagoon"
	| "violet"
	| "amber"
	| "rose"
	| "mint"
	| "slate"
	| "sky";

export interface FeedViewer {
	/** The API user id of the logged-in viewer, used to match against post authors. */
	id: string;
	name: string;
	handle: string;
	tone: AvatarTone;
	stats: Array<{ label: string; value: string }>;
}

export interface FeedPerson {
	name: string;
	handle: string;
	tone: AvatarTone;
}

export interface FeedPost {
	id: string;
	/** The API user ID of the author, used to match against the session. */
	authorId: string;
	author: FeedPerson;
	/** Organization accounts get a letter mark instead of a portrait. */
	brand?: boolean;
	verified?: boolean;
	/** ISO-8601 timestamp when the post was created. */
	createdAt: string;
	/** Human-readable relative time for display. */
	time: string;
	body: string;
	reactions: Array<{ id: string; emoji: string; tone: AvatarTone }>;
	reactionCount: string;
	commentCount: string;
	media?: { alt: string; title: string; subtitle: string };
}

export interface FeedTrend {
	id: string;
	category?: string;
	tag: string;
	meta: string;
}

export const VIEWER: FeedViewer = {
	id: "viewer-1",
	name: "Yeremias NJ",
	handle: "@notajoyoo",
	tone: "amber",
	stats: [
		{ label: "Likes", value: "6,664" },
		{ label: "Posts", value: "9,991" },
	],
};

export const SUGGESTED: FeedPerson[] = [
	{ name: "Product Hunt", handle: "@ProductHunt", tone: "rose" },
	{ name: "Kevin William", handle: "@kevinwilliam", tone: "sky" },
	{ name: "Ryan Hoover", handle: "@rrhoover", tone: "amber" },
];

export const POSTS: FeedPost[] = [
	{
		id: "viewer-post",
		authorId: VIEWER.id,
		author: { name: VIEWER.name, handle: VIEWER.handle, tone: VIEWER.tone },
		createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
		time: "3 minutes ago",
		body: "Just shipped the new feed redesign — check it out and let me know what you think!",
		reactions: [{ id: "cheers", emoji: "🎉", tone: "amber" }],
		reactionCount: "12",
		commentCount: "3 Comments",
	},
	{
		id: "elon-musk",
		authorId: "user-elon-musk",
		author: { name: "Elon Musk", handle: "@elonmusk", tone: "slate" },
		verified: true,
		createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		time: "Few minutes ago",
		body: "Let's set an age limit after which you can't run for political office, perhaps a number just below 70 …",
		reactions: [
			{ id: "laud", emoji: "❤️", tone: "rose" },
			{ id: "grin", emoji: "😂", tone: "amber" },
			{ id: "cheer", emoji: "❤️", tone: "violet" },
		],
		reactionCount: "241k",
		commentCount: "45 Comments",
	},
	{
		id: "hypebeast",
		authorId: "user-hypebeast",
		author: { name: "HYPEBEAST", handle: "@HYPEBEAST", tone: "slate" },
		brand: true,
		verified: true,
		createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		time: "2 hours ago",
		body: "Sole Mates: Ralph Sugutan and the Nike KD 4 'Easter'",
		reactions: [
			{ id: "fire", emoji: "🔥", tone: "rose" },
			{ id: "clap", emoji: "👏", tone: "sky" },
		],
		reactionCount: "3.1k",
		commentCount: "128 Comments",
		media: {
			alt: "Ralph Sugutan holding a pair of Nike KD 4 Easter sneakers in front of a shelf of shoe boxes",
			title: "On the shelf",
			subtitle: "Nike KD 4 “Easter” · 2026",
		},
	},
];

export const TRENDS: FeedTrend[] = [
	{ id: "minions", tag: "#Minions", meta: "97.7 k Tweets" },
	{ id: "senin-barokah", tag: "#SeninBarokah", meta: "87.2 k Tweets" },
	{ id: "tixos", category: "NFT", tag: "#Tixos", meta: "122.7 k Tweets" },
	{ id: "mufc", category: "FOOTBALL", tag: "#MUFC", meta: "97.2 k Tweets" },
	{ id: "rangnick", tag: "#Rangnick", meta: "77.2 k Tweets" },
	{ id: "thx-ole", tag: "#ThxOle", meta: "54.2 k Tweets" },
];

export const TREND_REGION = "TRENDING IN INDONESIA";

export const COMPOSER_ACTIONS = [
	{ id: "photo", label: "Photo" },
	{ id: "video", label: "Video" },
	{ id: "gif", label: "GIF" },
] as const;
