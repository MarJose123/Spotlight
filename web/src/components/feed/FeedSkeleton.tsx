/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Skeleton } from "@mantine/core";

/** Skeleton placeholder for the top navigation bar while the feed loads. */
function TopBarSkeleton() {
	return (
		<header className="sticky top-0 z-30 shrink-0 border-b border-[var(--feed-line-soft)] bg-[var(--feed-panel)]">
			<div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center gap-3 px-3 py-3.5 sm:px-5">
				<div className="flex min-w-0 items-center gap-3">
					<Skeleton circle={true} height={22} width={22} />
					<Skeleton height={38} width={{ base: 160, sm: 228 }} radius="full" />
				</div>
				<div className="ml-auto flex items-center gap-2">
					<Skeleton
						className="hidden md:block"
						height={32}
						width={120}
						radius="full"
					/>
					<Skeleton circle={true} height={28} width={28} />
					<Skeleton circle={true} height={28} width={28} />
				</div>
			</div>
		</header>
	);
}

/** Skeleton placeholder for the ProfileCard sidebar. */
function ProfileCardSkeleton() {
	return (
		<section className="overflow-hidden rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)]">
			<Skeleton height={104} width="100%" radius={0} />
			<div className="flex flex-col items-center px-4 pb-4">
				<Skeleton className="-mt-9" circle={true} height={64} width={64} />
				<Skeleton className="mt-2.5 mb-0" height={16} width={96} />
				<Skeleton className="mt-1" height={12} width={64} />
			</div>
			<div className="grid grid-cols-2 border-t border-[var(--feed-line)]">
				<div className="py-2.5 text-center">
					<Skeleton className="mx-auto mb-1" height={12} width={32} />
					<Skeleton className="mx-auto" height={10} width={40} />
				</div>
				<div className="border-l border-[var(--feed-line)] py-2.5 text-center">
					<Skeleton className="mx-auto mb-1" height={12} width={32} />
					<Skeleton className="mx-auto" height={10} width={40} />
				</div>
			</div>
		</section>
	);
}

/** Skeleton placeholder for the ComposerCard. */
function ComposerCardSkeleton() {
	return (
		<section className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
			<div className="flex items-start gap-3">
				<Skeleton circle={true} height={38} width={38} />
				<div className="min-w-0 flex-1 space-y-2">
					<Skeleton height={16} width={160} />
					<Skeleton height={16} width={112} />
				</div>
			</div>
		</section>
	);
}

/** Skeleton placeholder for a single PostCard. */
function PostCardSkeleton() {
	return (
		<article className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
			<header className="flex items-start gap-3">
				<Skeleton circle={true} height={38} width={38} />
				<div className="min-w-0 flex-1 space-y-1.5">
					<Skeleton height={14} width={112} />
					<Skeleton height={12} width={64} />
				</div>
			</header>
			<div className="mt-2.5 space-y-2">
				<Skeleton height={14} width="100%" />
				<Skeleton height={14} width="75%" />
				<Skeleton height={14} width="50%" />
			</div>
			<div className="mt-3 border-t border-[var(--feed-line)] pt-3">
				<div className="flex gap-2">
					<Skeleton height={28} width={64} radius="full" />
					<Skeleton height={28} width={64} radius="full" />
				</div>
			</div>
		</article>
	);
}

/** Skeleton placeholder for the Leaderboard sidebar. */
function LeaderboardSkeleton() {
	return (
		<section className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
			<Skeleton className="mb-3" height={16} width={96} />
			<div className="space-y-3">
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="flex items-center gap-2.5">
						<Skeleton circle={true} height={28} width={28} />
						<Skeleton circle={true} height={32} width={32} />
						<Skeleton height={12} width={80} />
					</div>
				))}
			</div>
		</section>
	);
}

const SKELETON_POSTS = ["a", "b", "c", "d"];

export function FeedSkeleton() {
	return (
		<div className="spotlight-feed flex flex-col overflow-hidden">
			<TopBarSkeleton />

			<div className="mx-auto grid min-h-0 w-full max-w-[1360px] flex-1 grid-cols-1 grid-rows-1 gap-4 px-3 pt-4 sm:px-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
				<aside className="spotlight-feed-column hidden min-h-0 flex-col gap-4 overflow-y-auto pb-4 lg:flex">
					<ProfileCardSkeleton />
					<Skeleton className="mx-auto" height={12} width={96} />
				</aside>

				<div className="spotlight-feed-column flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto pb-4">
					<ComposerCardSkeleton />
					{SKELETON_POSTS.map((key) => (
						<PostCardSkeleton key={key} />
					))}
				</div>

				<aside className="spotlight-feed-column hidden min-h-0 overflow-y-auto pb-4 xl:block">
					<LeaderboardSkeleton />
				</aside>
			</div>
		</div>
	);
}
