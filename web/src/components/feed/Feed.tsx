/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { useEffect, useState } from "react";
import type { FeedViewer } from "../../lib/feed-data";
import { POSTS, VIEWER } from "../../lib/feed-data";
import { readSession } from "../../lib/session";
import { ComposerCard } from "./ComposerCard";
import { FeedTopBar } from "./FeedTopBar";
import { Leaderboard } from "./Leaderboard";
import { PostCard } from "./PostCard";
import { ProfileCard } from "./ProfileCard";

const APP_VERSION = import.meta.env.APP_VERSION;

export function Feed() {
	const [viewer, setViewer] = useState<FeedViewer>(VIEWER);

	useEffect(() => {
		const user = readSession()?.user;
		if (!user) {
			return;
		}

		setViewer((current) => ({
			...current,
			id: user.id,
			name: user.displayName ?? user.name ?? current.name,
			handle: user.username ? `@${user.username}` : current.handle,
		}));
	}, []);

	return (
		<div className="spotlight-feed flex flex-col overflow-hidden">
			<FeedTopBar viewer={viewer} />

			<div className="mx-auto grid min-h-0 w-full max-w-[1360px] flex-1 grid-cols-1 grid-rows-1 gap-4 px-3 pt-4 sm:px-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
				<aside className="spotlight-feed-column hidden min-h-0 flex-col gap-4 overflow-y-auto pb-4 lg:flex">
					<ProfileCard viewer={viewer} />
					<p className="text-center text-[11px] text-[var(--feed-ink-dim)]">
						v{APP_VERSION} · AGPL-3.0
					</p>
				</aside>

				<div className="spotlight-feed-column flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto pb-4">
					<ComposerCard viewer={viewer} />

					{POSTS.map((post) => (
						<PostCard key={post.id} post={post} viewerId={viewer.id} />
					))}
				</div>

				<aside className="spotlight-feed-column hidden min-h-0 overflow-y-auto pb-4 xl:block">
					<Leaderboard />
				</aside>
			</div>
		</div>
	);
}
