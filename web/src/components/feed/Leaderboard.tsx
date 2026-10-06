/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Trophy } from "lucide-react";
import { useLeaderboard } from "#/lib/api-queries";
import type { AvatarTone } from "#/lib/feed-data";
import { Avatar } from "./media";

/** Derive a stable avatar tone from a user id so the same user always renders the same colour. */
function toneForId(id: string): AvatarTone {
	const tones: AvatarTone[] = [
		"lagoon",
		"violet",
		"amber",
		"rose",
		"mint",
		"slate",
		"sky",
	];
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	return tones[Math.abs(hash) % tones.length];
}

/** Format a number to a compact string like "241k" or "3.1m". */
function formatCount(count: number): string {
	if (count >= 1_000_000) {
		return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
	}
	if (count >= 1_000) {
		return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
	}
	return count.toString();
}

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
	const { data, isLoading, isError } = useLeaderboard();

	if (isLoading) {
		return (
			<section className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
				<div className="flex items-center gap-2 pb-2">
					<Trophy
						size={15}
						className="shrink-0 text-[var(--feed-accent)]"
						aria-hidden="true"
					/>
					<h2 className="m-0 text-[13.5px] font-bold">Leaderboard</h2>
				</div>
				<div className="space-y-3 pt-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex items-center gap-2.5 animate-pulse">
							<div className="h-7 w-7 shrink-0 rounded-full bg-[var(--feed-inset)]" />
							<div className="h-8 w-8 shrink-0 rounded-full bg-[var(--feed-inset)]" />
							<div className="h-3 w-20 rounded bg-[var(--feed-inset)]" />
						</div>
					))}
				</div>
			</section>
		);
	}

	if (isError || !data || data.length === 0) {
		return (
			<section className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
				<div className="flex items-center gap-2 pb-2">
					<Trophy
						size={15}
						className="shrink-0 text-[var(--feed-accent)]"
						aria-hidden="true"
					/>
					<h2 className="m-0 text-[13.5px] font-bold">Leaderboard</h2>
				</div>
				<p className="text-center text-[11px] text-[var(--feed-ink-dim)]">
					No data yet
				</p>
			</section>
		);
	}

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
				{data.map((entry) => (
					<li
						key={entry.user.id}
						className={`border-t border-[var(--feed-line)] px-4 py-3 transition hover:bg-[var(--feed-card-hover)] ${
							entry.rank <= 3
								? "bg-gradient-to-r from-[var(--feed-accent)]/[0.04] to-transparent"
								: ""
						}`}
					>
						<div className="flex items-center gap-2.5">
							<RankBadge rank={entry.rank} />
							<Avatar
								name={entry.user.name}
								tone={toneForId(entry.user.id)}
								size={30}
							/>
							<div className="min-w-0 flex-1">
								<span className="truncate text-[12.5px] font-bold">
									{entry.user.displayName}
								</span>
							</div>
							<span className="shrink-0 text-[11px] font-semibold text-[var(--feed-accent)]">
								{formatCount(entry.likesCount)}
							</span>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
