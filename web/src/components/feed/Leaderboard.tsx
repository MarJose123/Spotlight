/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Trophy } from "lucide-react";
import { POSTS } from "../../lib/feed-data";
import { Avatar } from "./media";

/**
 * Parse a reaction count string like "241k" or "3.1k" into a numeric value.
 */
function parseCount(count: string): number {
	const num = parseFloat(count);
	if (Number.isNaN(num)) return 0;
	if (count.toLowerCase().includes("m")) return num * 1_000_000;
	if (count.toLowerCase().includes("k")) return num * 1_000;
	return num;
}

/**
 * Format a number back to a compact string like "241k" or "3.1k".
 */
function formatCount(count: number): string {
	if (count >= 1_000_000) {
		return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
	}
	if (count >= 1_000) {
		return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
	}
	return count.toString();
}

/**
 * Aggregate posts by author and sum their reaction counts, then sort
 * descending by total likes.
 */
function aggregateByAuthor() {
	const map = new Map<string, { name: string; tone: string; likes: number }>();

	for (const post of POSTS) {
		const key = post.author.handle;
		const existing = map.get(key);
		if (existing) {
			existing.likes += parseCount(post.reactionCount);
		} else {
			map.set(key, {
				name: post.author.name,
				tone: post.author.tone,
				likes: parseCount(post.reactionCount),
			});
		}
	}

	return [...map.values()].sort((a, b) => b.likes - a.likes);
}

const LEADERBOARD = aggregateByAuthor();
const MEDALS = ["🥇", "🥈", "🥉"];

function RankBadge({ rank }: { rank: number }) {
	if (rank <= 3) {
		return (
			<span className="flex h-7 w-7 shrink-0 items-center justify-center text-[16px]">
				{MEDALS[rank - 1]}
			</span>
		);
	}

	return (
		<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--feed-inset)] text-[11px] font-bold text-[var(--feed-ink-dim)]">
			{rank}
		</span>
	);
}

export function Leaderboard() {
	return (
		<section className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)]">
			<div className="flex items-center gap-2 px-4 pt-4 pb-2">
				<Trophy
					size={15}
					className="shrink-0 text-[var(--feed-accent)]"
					aria-hidden="true"
				/>
				<h2 className="m-0 text-[13.5px] font-bold">Leaderboard</h2>
			</div>

			<ul className="m-0 list-none p-0">
				{LEADERBOARD.map((entry, index) => (
					<li
						key={entry.name}
						className={`border-t border-[var(--feed-line)] px-4 py-3 transition hover:bg-[var(--feed-card-hover)] ${
							index < 3
								? "bg-gradient-to-r from-[var(--feed-accent)]/[0.04] to-transparent"
								: ""
						}`}
					>
						<div className="flex items-center gap-2.5">
							<RankBadge rank={index + 1} />
							<Avatar name={entry.name} tone={entry.tone} size={30} />
							<div className="min-w-0 flex-1">
								<span className="truncate text-[12.5px] font-bold">
									{entry.name}
								</span>
							</div>
							<span className="shrink-0 text-[11px] font-semibold text-[var(--feed-accent)]">
								{formatCount(entry.likes)}
							</span>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
