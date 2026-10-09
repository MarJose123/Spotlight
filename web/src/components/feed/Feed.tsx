/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiPost } from "#/lib/api";
import { usePostsInfinite, useUserProfileStats } from "#/lib/api-queries";
import type { AvatarTone, FeedViewer } from "#/lib/feed-data";
import { VIEWER } from "#/lib/feed-data";
import { readSession, type Session } from "#/lib/session";
import { AuthTopBar } from "../AuthTopBar";
import { ComposerCard } from "./ComposerCard";
import { FeedSkeleton, PostCardSkeleton } from "./FeedSkeleton";
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

dayjs.extend(relativeTime);

/** Format an ISO timestamp as a relative string ("3 minutes ago"). */
function formatRelativeTime(iso: string): string {
	return dayjs(iso).fromNow();
}

const APP_VERSION = import.meta.env.APP_VERSION;

/** Extract plain text from Tiptap JSON for alt text and subtitles. */
function extractPlainText(contentJson: string): string {
	try {
		const json = JSON.parse(contentJson);
		const texts: string[] = [];
		function walk(node: unknown) {
			if (!node || typeof node !== "object") return;
			const obj = node as Record<string, unknown>;
			if (obj.type === "text" && typeof obj.text === "string") {
				texts.push(obj.text);
			}
			if (Array.isArray(obj.content)) {
				for (const child of obj.content) walk(child);
			}
		}
		if (Array.isArray(json?.content)) {
			for (const node of json.content) walk(node);
		}
		return texts.join(" ");
	} catch {
		return contentJson;
	}
}

/** Convert a raw API post into the shape PostCard expects. */
function mapPost(post: ApiPost) {
	const tone = toneForId(post.author.id);
	const plainText = extractPlainText(post.contentJson);
	const mediaItems = post.attachments.map((attachment) => ({
		alt: plainText.slice(0, 120),
		title:
			attachment.type === "image"
				? "Photo"
				: attachment.type === "video"
					? "Video"
					: "GIF",
		subtitle: plainText.slice(0, 80),
		url: attachment.url,
		type: (attachment.type === "video" || attachment.type === "image"
			? attachment.type
			: "gif") as "image" | "video" | "gif",
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
		time: formatRelativeTime(post.createdAt),
		contentJson: post.contentJson,
		reactions: (post.likedBy ?? []).map((id) => ({
			id,
			emoji: "❤️",
			tone: toneForId(id),
		})),
		reactionCount: String(post.likesCount),
		commentCount: `${post.commentsCount} Comments`,
		mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
	};
}

export function Feed() {
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isLoading,
		isFetchingNextPage,
		isError,
	} = usePostsInfinite();
	const session = useSession();
	const sessionUser = session?.user;

	// Flatten all pages of posts and map to the feed shape — memoized to avoid
	// reallocating the entire array on every render.
	const posts = useMemo(
		() => data?.pages.flatMap((page) => page.data.map(mapPost)) ?? [],
		[data],
	);

	// Sentinel at the bottom of the feed triggers the next page load when it
	// becomes visible. Held in state so the observer stays connected across
	// renders — a plain ref would lose the element reference.
	const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const paginationRef = useRef({
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	});

	useEffect(() => {
		paginationRef.current = { hasNextPage, isFetchingNextPage, fetchNextPage };
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	useEffect(() => {
		if (!sentinel) return;

		const el = sentinel;
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				const pagination = paginationRef.current;
				if (
					entry.isIntersecting &&
					pagination.hasNextPage &&
					!pagination.isFetchingNextPage
				) {
					pagination.fetchNextPage();
				}
			},
			{ root: scrollContainer, rootMargin: "64px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [sentinel]);

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

				<div
					ref={scrollContainerRef}
					className="spotlight-feed-column flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto pb-4"
				>
					<ComposerCard viewer={viewer} />

					{posts.map((post) => (
						<PostCard
							key={post.id}
							post={post}
							viewerId={viewer.id}
							session={session}
						/>
					))}

					{isFetchingNextPage && (
						<>
							<PostCardSkeleton />
							<PostCardSkeleton />
						</>
					)}

					{/* Infinite scroll sentinel — always mounted so observer stays connected */}
					<div ref={setSentinel} className="h-1" />
				</div>

				<aside className="spotlight-feed-column hidden min-h-0 overflow-y-auto pb-4 xl:block">
					<Leaderboard />
				</aside>
			</div>
		</div>
	);
}
