/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Button, Menu } from "@mantine/core";
import {
	Edit,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import type { FeedPost } from "../../lib/feed-data";
import { Avatar, PostMedia, toneGradient } from "./media";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function canEditPost(viewerId: string, post: FeedPost): boolean {
	if (viewerId !== post.authorId) return false;
	const age = Date.now() - new Date(post.createdAt).getTime();
	return age >= 0 && age <= EDIT_WINDOW_MS;
}

export function PostCard({
	post,
	viewerId,
}: {
	post: FeedPost;
	viewerId: string;
}) {
	const hasEngagement = post.reactions.length > 0;
	const editable = canEditPost(viewerId, post);

	return (
		<article className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
			<header className="flex items-start gap-3">
				<Avatar name={post.author.name} tone={post.author.tone} size={38} />

				<div className="min-w-0 flex-1">
					<span className="truncate text-[13px] font-bold">
						{post.author.name}
					</span>
					<p className="m-0 text-[11.5px] text-[var(--feed-ink-dim)]">
						{post.time}
					</p>
				</div>

				{post.authorId === viewerId && editable && (
					<Menu position="bottom-end" shadow="sm" width={160}>
						<Menu.Target>
							<button
								type="button"
								aria-label="More actions"
								className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--feed-ink-dim)] transition hover:bg-[var(--feed-hover)] hover:text-[var(--feed-ink)]"
							>
								<MoreHorizontal size={16} aria-hidden="true" />
							</button>
						</Menu.Target>

						<Menu.Dropdown>
							<Menu.Item leftSection={<Edit size={14} aria-hidden="true" />}>
								Edit
							</Menu.Item>
							<Menu.Item
								color="red"
								leftSection={<Trash2 size={14} aria-hidden="true" />}
							>
								Delete
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				)}
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
				<Button
					variant="subtle"
					size="xs"
					leftSection={<Heart size={14} aria-hidden="true" />}
					className="rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)]"
				>
					Like
				</Button>
				<Button
					variant="subtle"
					size="xs"
					leftSection={<MessageCircle size={14} aria-hidden="true" />}
					className="rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)]"
				>
					Comment
				</Button>
			</div>
		</article>
	);
}
