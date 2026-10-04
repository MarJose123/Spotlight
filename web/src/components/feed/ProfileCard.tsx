/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { FeedViewer } from "#/lib/feed-data.ts";
import { Avatar, CoverArt } from "./media";

export function ProfileCard({ viewer }: { viewer: FeedViewer }) {
	return (
		<section className="overflow-hidden rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)]">
			<div className="h-[104px] w-full">
				<CoverArt />
			</div>

			<div className="flex flex-col items-center px-4 pb-4">
				<span className="-mt-9 rounded-full border-[3px] border-[var(--feed-card)] bg-[var(--feed-card)]">
					<Avatar name={viewer.name} tone={viewer.tone} size={64} />
				</span>

				<h2 className="mt-2.5 mb-0 text-[15px] font-bold">{viewer.name}</h2>
				<p className="m-0 text-[12px] text-[var(--feed-ink-dim)]">
					{viewer.handle}
				</p>
				<p className="mt-2 mb-0 text-center text-[12px] leading-5 text-[var(--feed-ink-soft)]">
					{viewer.bio}
				</p>
			</div>

			<div className="grid grid-cols-2 border-t border-[var(--feed-line)]">
				{viewer.stats.map((stat, index) => (
					<div
						key={stat.label}
						className={`py-2.5 text-center ${
							index > 0 ? "border-l border-[var(--feed-line)]" : ""
						}`}
					>
						<p className="m-0 text-[13px] font-bold">{stat.value}</p>
						<p className="m-0 text-[11px] text-[var(--feed-ink-dim)]">
							{stat.label}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
