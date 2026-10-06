/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { usePosts, useUserProfileStats } from "#/lib/api-queries";
import type { AvatarTone, FeedViewer } from "#/lib/feed-data";
import { VIEWER } from "#/lib/feed-data";
import { readSession, type Session } from "#/lib/session";
import { AuthTopBar } from "../AuthTopBar";
import { ComposerCard } from "./ComposerCard";
import { FeedSkeleton } from "./FeedSkeleton";
import { Leaderboard } from "./Leaderboard";
import { PostCard } from "./PostCard";
import { ProfileCard } from "./ProfileCard";

/** Derive a stable avatar tone from a user id so the same author always renders the same colour. */
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

/**
 * React to session changes by listening for localStorage mutations and the
 * custom event the auth flow dispatches after sign-in or sign-out.
 */
function useSession(): Session | null {
	const [session, setSession] = useState(() => readSession());

	useEffect(() => {
		const handler = () => setSession(readSession());
		window.addEventListener("storage", handler);
		window.addEventListener("spotlight:session-changed", handler);
		return () => {
			window.removeEventListener("storage", handler);
			window.removeEventListener("spotlight:session-changed", handler);
		};
	}, []);

	return session;
}

/** Format an ISO timestamp as a short relative string ("3 minutes ago"). */
function relativeTime(iso: string): string {
	const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
	if (seconds < 60) return "Just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
	const days = Math.floor(hours / 24);
	return `${days} day${days > 1 ? "s" : ""} ago`;
}

const APP_VERSION = import.meta.env.APP_VERSION;

export function Feed() {
	const { data, isLoading, isError } = usePosts();
	const session = useSession();
	const sessionUser = session?.user;

	// Build viewer from session, falling back to static placeholder.
	const viewerId = sessionUser?.id;
	const viewer: FeedViewer = {
		...VIEWER,
		id: viewerId ?? VIEWER.id,
		name: sessionUser?.displayName ?? sessionUser?.name ?? VIEWER.name,
		handle: sessionUser?.username ? `@${sessionUser.username}` : VIEWER.handle,
		tone: toneForId(viewerId ?? VIEWER.id),
	};

	// Fetch live profile stats only when the user is signed in.
	const { data: profileStats, isLoading: statsLoading } =
		useUserProfileStats(viewerId);

	if (isLoading) {
		return <FeedSkeleton />;
	}

	if (isError) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center">
				<section className="island-shell rise-in rounded-[2rem] px-8 py-10 text-center sm:px-10 sm:py-14">
					<p className="island-kicker mb-4">Connection error</p>
					<span className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--lagoon-deep)]">
						<WifiOff className="h-6 w-6" aria-hidden={true} />
					</span>
					<h1 className="display-title mx-auto mt-4 mb-0 text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
						Unable to load feed
					</h1>
					<p className="mx-auto mt-4 mb-0 max-w-xs text-base leading-7 text-[var(--sea-ink-soft)]">
						Check your connection and try again.
					</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-8 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-6 py-3 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
					>
						<RefreshCw className="h-4 w-4" aria-hidden={true} />
						Try again
					</button>
				</section>
			</div>
		);
	}

	// Map API posts to the feed shape PostCard expects.
	const posts = (data?.data ?? []).map((post) => {
		const tone = toneForId(post.author.id);
		const mediaItems = post.attachments.map((attachment) => ({
			alt: post.content.slice(0, 120),
			title:
				attachment.type === "image"
					? "Photo"
					: attachment.type === "video"
						? "Video"
						: "GIF",
			subtitle: post.content.slice(0, 80),
			url: attachment.url,
			type: attachment.type,
		}));

		return {
			id: post.id,
			authorId: post.author.id,
			author: {
				name: post.author.name,
				handle: post.author.username ? `@${post.author.username}` : "",
				tone,
			},
			createdAt: post.createdAt,
			time: relativeTime(post.createdAt),
			body: post.content,
			reactions: (post.likedBy ?? []).map((id) => ({
				id,
				emoji: "❤️",
				tone: toneForId(id),
			})),
			reactionCount: String(post.likesCount),
			commentCount: `${post.commentsCount} Comments`,
			mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
		};
	});

	return (
		<div className="spotlight-feed flex flex-col overflow-hidden">
			<AuthTopBar viewer={viewer} />

			<div className="mx-auto grid min-h-0 w-full max-w-[1360px] flex-1 grid-cols-1 grid-rows-1 gap-4 px-3 pt-4 sm:px-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
				<aside className="spotlight-feed-column hidden min-h-0 flex-col gap-4 overflow-y-auto pb-4 lg:flex">
					<ProfileCard
						viewer={viewer}
						stats={profileStats ?? undefined}
						statsLoading={statsLoading}
					/>
					<p className="text-center text-[11px] text-[var(--feed-ink-dim)]">
						v{APP_VERSION} · AGPL-3.0
					</p>
				</aside>

				<div className="spotlight-feed-column flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto pb-4">
					<ComposerCard viewer={viewer} />

					{posts.map((post) => (
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
