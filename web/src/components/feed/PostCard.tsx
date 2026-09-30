/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import {
	Bookmark,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Share2,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { FeedPost } from "../../lib/feed-data";
import { Avatar, PostMedia, toneGradient, VerifiedBadge } from "./media";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

function ActionPill({ icon: Icon, label }: { icon: Icon; label: string }) {
	return (
		<button
			type="button"
			className="inline-flex items-center gap-1.5 rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--feed-ink-soft)] transition hover:text-[var(--feed-ink)]"
		>
			<Icon width={14} height={14} aria-hidden="true" />
			{label}
		</button>
	);
}

function IconPill({ icon: Icon, label }: { icon: Icon; label: string }) {
	return (
		<button
			type="button"
			aria-label={label}
			className="grid h-[30px] w-[30px] place-items-center rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] text-[var(--feed-ink-soft)] transition hover:text-[var(--feed-ink)]"
		>
			<Icon width={14} height={14} aria-hidden="true" />
		</button>
	);
}

export function PostCard({ post }: { post: FeedPost }) {
	const hasEngagement = post.reactions.length > 0;

	return (
		<article className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
			<header className="flex items-start gap-3">
				<Avatar
					name={post.author.name}
					tone={post.author.tone}
					size={38}
					brand={post.brand}
				/>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						<span className="truncate text-[13px] font-bold">
							{post.author.name}
						</span>
						{post.verified && <VerifiedBadge />}
					</div>
					<p className="m-0 text-[11.5px] text-[var(--feed-ink-dim)]">
						{post.time}
					</p>
				</div>

				<button
					type="button"
					aria-label="More actions"
					className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--feed-ink-dim)] transition hover:bg-[var(--feed-hover)] hover:text-[var(--feed-ink)]"
				>
					<MoreHorizontal size={16} aria-hidden="true" />
				</button>
			</header>

			<p className="mt-2.5 mb-0 text-[13px] leading-6 text-[var(--feed-ink)]">
				{post.body}
			</p>

			{post.media && <PostMedia media={post.media} />}

			{hasEngagement && (
				<div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2">
					<div className="flex items-center">
						{post.reactions.map((reaction, index) => (
							<span
								key={reaction.id}
								className="grid h-[22px] w-[22px] place-items-center rounded-full text-[11px] ring-2 ring-[var(--feed-card)]"
								style={{
									backgroundImage: toneGradient(reaction.tone),
									marginLeft: index === 0 ? 0 : -7,
								}}
							>
								{reaction.emoji}
							</span>
						))}
					</div>

					<span className="text-[12px] text-[var(--feed-ink-soft)]">
						{post.reactionCount}
					</span>
					<span className="ml-auto text-[12px] text-[var(--feed-ink-dim)]">
						{post.commentCount}
					</span>
				</div>
			)}

			<div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--feed-line)] pt-3">
				<ActionPill icon={Heart} label="Like" />
				<ActionPill icon={MessageCircle} label="Comment" />

				<div className="ml-auto flex items-center gap-1.5">
					<IconPill icon={Bookmark} label="Save" />
					<IconPill icon={Share2} label="Share" />
				</div>
			</div>
		</article>
	);
}
