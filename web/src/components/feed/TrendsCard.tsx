/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { MoreHorizontal, Settings } from "lucide-react";
import { TREND_REGION, TRENDS } from "../../lib/feed-data";

export function TrendsCard() {
	return (
		<section className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)]">
			<div className="flex items-center justify-between px-4 pt-4">
				<h2 className="m-0 text-[13.5px] font-bold">Trend for you</h2>
				<button
					type="button"
					aria-label="Trend settings"
					className="grid h-7 w-7 place-items-center rounded-full text-[var(--feed-ink-dim)] transition hover:bg-[var(--feed-hover)] hover:text-[var(--feed-ink)]"
				>
					<Settings size={15} aria-hidden="true" />
				</button>
			</div>

			<p className="m-0 px-4 pt-3 pb-1 text-[10px] font-bold tracking-[0.14em] text-[var(--feed-ink-dim)]">
				{TREND_REGION}
			</p>

			<ul className="m-0 list-none p-0">
				{TRENDS.map((trend) => (
					<li key={trend.id}>
						{trend.category && (
							<p className="m-0 px-4 pt-3 pb-0.5 text-[10px] font-bold tracking-[0.14em] text-[var(--feed-ink-dim)]">
								{trend.category} · TRENDING
							</p>
						)}

						<button
							type="button"
							className="flex w-full items-start gap-2 px-4 py-2 text-left transition hover:bg-[var(--feed-card-hover)]"
						>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-[13px] font-bold">
									{trend.tag}
								</span>
								<span className="block text-[11.5px] text-[var(--feed-ink-dim)]">
									{trend.meta}
								</span>
							</span>
							<MoreHorizontal
								size={15}
								className="mt-0.5 shrink-0 text-[var(--feed-ink-dim)]"
								aria-hidden="true"
							/>
						</button>
					</li>
				))}
			</ul>

			<div className="border-t border-[var(--feed-line)] px-4 py-3">
				<button
					type="button"
					className="text-[12.5px] font-semibold text-[var(--feed-accent)] transition hover:underline"
				>
					Show More
				</button>
			</div>
		</section>
	);
}
