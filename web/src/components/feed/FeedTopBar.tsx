/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Bell, Home, LayoutGrid, Search, Spotlight } from "lucide-react";
import type { FeedViewer } from "#/lib/feed-data.ts";
import { FeedThemeToggle } from "./FeedThemeToggle";
import { TopBarAction } from "./TopBarAction";
import { UserMenu } from "./UserMenu";

export function FeedTopBar({ viewer }: { viewer: FeedViewer }) {
	return (
		<header className="sticky top-0 z-30 shrink-0 border-b border-[var(--feed-line-soft)] bg-[var(--feed-panel)]">
			<div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center gap-3 px-3 py-3.5 sm:px-5">
				<div className="flex min-w-0 items-center gap-3">
					<Spotlight
						size={22}
						strokeWidth={2.3}
						className="shrink-0 text-[var(--feed-accent)]"
						aria-hidden="true"
					/>

					<label className="flex w-[160px] items-center gap-2 rounded-full border border-[var(--feed-line-soft)] bg-[var(--feed-inset)] px-3.5 py-2 sm:w-[228px]">
						<Search
							size={13}
							className="shrink-0 text-[var(--feed-ink-dim)]"
							aria-hidden="true"
						/>
						<input
							type="search"
							placeholder="# Explore"
							aria-label="Explore"
							className="w-full bg-transparent text-[12.5px] text-[var(--feed-ink)] outline-none placeholder:text-[var(--feed-ink-dim)]"
						/>
					</label>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<div className="hidden items-center gap-0.5 rounded-full border border-[var(--feed-line-soft)] bg-[var(--feed-inset)] p-1 md:inline-flex">
						<TopBarAction label="Explore">
							<LayoutGrid size={15} aria-hidden="true" />
						</TopBarAction>
						<TopBarAction label="Feed">
							<Home size={15} aria-hidden="true" />
						</TopBarAction>
						<TopBarAction label="Notifications" badge="1">
							<Bell size={15} aria-hidden="true" />
						</TopBarAction>
					</div>

					<FeedThemeToggle />

					<UserMenu viewer={viewer} />
				</div>
			</div>
		</header>
	);
}
