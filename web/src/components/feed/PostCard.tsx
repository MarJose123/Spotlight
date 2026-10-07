/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Button, Menu, Modal, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import {
	Check,
	Edit,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Send,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	useComments,
	useCreateComment,
	useDeleteComment,
	useDeletePost,
	usePostLikes,
	useToggleLike,
	useUpdateComment,
	useUpdatePost,
} from "#/lib/api-queries";
import { readSession } from "#/lib/session";
import type { AvatarTone, FeedPost } from "../../lib/feed-data";
import { Avatar, MediaGrid, toneGradient } from "./media";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function canEditPost(viewerId: string, post: FeedPost): boolean {
	if (viewerId !== post.authorId) return false;
	const age = Date.now() - new Date(post.createdAt).getTime();
	return age >= 0 && age <= EDIT_WINDOW_MS;
}

function canEditComment(_authorId: string, createdAt: string): boolean {
	const age = Date.now() - new Date(createdAt).getTime();
	return age >= 0 && age <= EDIT_WINDOW_MS;
}

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

dayjs.extend(relativeTime);

/** Format an ISO timestamp as a relative string ("3 minutes ago", "2 hours ago"). */
function formatRelativeTime(iso: string): string {
	return dayjs(iso).fromNow();
}

export function PostCard({
	post,
	viewerId,
}: {
	post: FeedPost;
	viewerId: string;
}) {
	const [commentOpen, setCommentOpen] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
	const [editCommentText, setEditCommentText] = useState("");
	const [editingPost, setEditingPost] = useState(false);
	const [editPostText, setEditPostText] = useState("");
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [likesModalOpen, setLikesModalOpen] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const toggleLike = useToggleLike();
	const createComment = useCreateComment();
	const updateComment = useUpdateComment();
	const deleteComment = useDeleteComment();
	const updatePostMutation = useUpdatePost();
	const deletePostMutation = useDeletePost();
	const { data: comments } = useComments(post.id);
	const { data: likers, isLoading: likersLoading } = usePostLikes(post.id);

	const session = readSession();
	const isLiked = post.reactions.some((r) => r.id === viewerId);
	const likeCount = parseInt(post.reactionCount, 10) || 0;
	const commentCount = parseInt(post.commentCount, 10) || 0;

	const handleLike = useCallback(() => {
		if (!session) return;
		toggleLike.mutate({
			postId: post.id,
			userId: session.user?.id ?? viewerId,
		});
	}, [session, post.id, viewerId, toggleLike]);

	const handleComment = useCallback(() => {
		if (!commentText.trim()) return;
		createComment.mutate(
			{ postId: post.id, content: commentText.trim() },
			{
				onSettled: () => {
					setCommentText("");
					// Reset textarea height after clearing content.
					if (textareaRef.current) {
						textareaRef.current.style.height = "auto";
					}
				},
			},
		);
	}, [commentText, post.id, createComment]);

	// Focus the textarea when the comment section opens.
	useEffect(() => {
		if (commentOpen && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [commentOpen]);

	const hasEngagement = post.reactions.length > 0 || likeCount > 0;
	const editable = canEditPost(viewerId, post);
	const displayCommentCount = comments ? comments.length : commentCount;

	return (
		<article className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
			<header className="flex items-start gap-3">
				<Avatar name={post.author.name} tone={post.author.tone} size={38} />

				<div className="min-w-0 flex-1">
					<span className="truncate text-[13px] font-bold">
						{post.author.name}
					</span>
					<p className="m-0 text-[11.5px] text-[var(--feed-ink-dim)]">
						{formatRelativeTime(post.createdAt)}
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
							<Menu.Item
								leftSection={<Edit size={14} aria-hidden="true" />}
								onClick={() => {
									setEditingPost(true);
									setEditPostText(post.body);
								}}
							>
								Edit
							</Menu.Item>
							<Menu.Item
								color="red"
								leftSection={<Trash2 size={14} aria-hidden="true" />}
								onClick={() => {
									setDeleteConfirmOpen(true);
								}}
							>
								Delete
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				)}
			</header>

			<Modal
				opened={deleteConfirmOpen}
				onClose={() => setDeleteConfirmOpen(false)}
				title="Delete post"
				size="sm"
				centered
			>
				<p className="text-[13px] text-[var(--feed-ink)]">
					Are you sure you want to delete this post? This action cannot be
					undone.
				</p>
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant="subtle"
						size="xs"
						onClick={() => setDeleteConfirmOpen(false)}
						className="rounded-full text-[12px] font-semibold text-[var(--feed-ink-dim)] hover:text-[var(--feed-ink)]"
					>
						Cancel
					</Button>
					<Button
						color="red"
						size="xs"
						loading={deletePostMutation.isPending}
						disabled={deletePostMutation.isPending}
						onClick={() => {
							deletePostMutation.mutate(post.id, {
								onSuccess: () => {
									notifications.show({
										title: "Post deleted",
										message: "Your post has been deleted.",
										color: "teal",
										autoClose: 3000,
									});
								},
								onError: () => {
									notifications.show({
										title: "Delete failed",
										message: "Could not delete the post. Please try again.",
										color: "red",
										autoClose: 5000,
									});
								},
								onSettled: () => setDeleteConfirmOpen(false),
							});
						}}
						className="rounded-full text-[12px] font-semibold"
					>
						Delete
					</Button>
				</div>
			</Modal>

			<Modal
				opened={likesModalOpen}
				onClose={() => setLikesModalOpen(false)}
				title={`${likeCount} ${likeCount === 1 ? "Like" : "Likes"}`}
				size="sm"
				centered
			>
				{likersLoading ? (
					<p className="text-[13px] text-[var(--feed-ink-dim)]">Loading...</p>
				) : likers && likers.length > 0 ? (
					<div className="space-y-2">
						{likers.map((liker) => (
							<div key={liker.id} className="flex items-center gap-3">
								<Avatar
									name={liker.name}
									tone={toneForId(liker.id)}
									size={32}
								/>
								<div className="min-w-0 flex-1">
									<span className="block truncate text-[13px] font-semibold text-[var(--feed-ink)]">
										{liker.name}
									</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-[13px] text-[var(--feed-ink-dim)]">
						No likes yet.
					</p>
				)}
			</Modal>

			{editingPost ? (
				<div className="mt-2.5 space-y-2">
					<Textarea
						value={editPostText}
						onChange={(e) => setEditPostText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								if (editPostText.trim() && editPostText.trim() !== post.body) {
									updatePostMutation.mutate(
										{ postId: post.id, content: editPostText.trim() },
										{
											onSuccess: () => {
												notifications.show({
													title: "Post updated",
													message: "Your post has been updated.",
													color: "teal",
													autoClose: 3000,
												});
											},
											onSettled: () => setEditingPost(false),
										},
									);
								} else {
									setEditingPost(false);
								}
							}
						}}
						autoResize
						minRows={1}
						maxRows={6}
						inputProps={{
							className:
								"bg-[var(--feed-inset)] text-[13px] leading-6 text-[var(--feed-ink)] placeholder:text-[var(--feed-ink-dim)]",
						}}
					/>
					<div className="flex gap-2">
						<Button
							variant="subtle"
							size="xs"
							leftSection={<Check size={12} aria-hidden="true" />}
							disabled={
								!editPostText.trim() ||
								editPostText.trim() === post.body ||
								updatePostMutation.isPending
							}
							loading={updatePostMutation.isPending}
							onClick={() => {
								if (editPostText.trim() && editPostText.trim() !== post.body) {
									updatePostMutation.mutate(
										{ postId: post.id, content: editPostText.trim() },
										{ onSettled: () => setEditingPost(false) },
									);
								} else {
									setEditingPost(false);
								}
							}}
							className="rounded-full text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)]"
						>
							Save
						</Button>
						<Button
							variant="subtle"
							size="xs"
							leftSection={<X size={12} aria-hidden="true" />}
							onClick={() => {
								setEditingPost(false);
								setEditPostText("");
							}}
							className="rounded-full text-[12px] font-semibold text-[var(--feed-ink-dim)] hover:text-[var(--feed-ink)]"
						>
							Cancel
						</Button>
					</div>
				</div>
			) : (
				<p className="mt-2.5 mb-0 text-[13px] leading-6 text-[var(--feed-ink)]">
					{post.body}
				</p>
			)}

			{post.mediaItems && post.mediaItems.length > 0 && (
				<MediaGrid items={post.mediaItems} />
			)}

			{(hasEngagement || displayCommentCount > 0) && (
				<div className="mt-3 flex items-center justify-between">
					{hasEngagement && (
						<div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
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

							<span
								role={"button"}
								onClick={() => setLikesModalOpen(true)}
								className="text-[12px] text-[var(--feed-ink-soft)] hover:underline cursor-pointer"
							>
								{likeCount} {likeCount === 1 ? "Like" : "Likes"}
							</span>
						</div>
					)}

					{displayCommentCount > 0 && (
						<span className="text-[12px] text-[var(--feed-ink-soft)]">
							{displayCommentCount}{" "}
							{displayCommentCount === 1 ? "Comment" : "Comments"}
						</span>
					)}
				</div>
			)}

			<div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--feed-line)] pt-3">
				<Button
					variant="subtle"
					size="xs"
					leftSection={
						<Heart
							size={14}
							aria-hidden="true"
							fill={isLiked ? "currentColor" : "none"}
						/>
					}
					loading={toggleLike.isPending}
					onClick={handleLike}
					c={isLiked ? "#e0245e" : "var(--feed-ink-soft)"}
					className="rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] text-[12px] font-semibold hover:text-[var(--feed-ink)]"
				>
					Like
				</Button>
				<Button
					variant="subtle"
					size="xs"
					leftSection={<MessageCircle size={14} aria-hidden="true" />}
					onClick={() => setCommentOpen((open) => !open)}
					className="rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)]"
				>
					Comment
				</Button>
			</div>

			{commentOpen && (
				<div className="mt-3 border-t border-[var(--feed-line)] pt-3">
					{session && (
						<div className="flex gap-2">
							<Textarea
								ref={textareaRef}
								placeholder="Write a comment..."
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleComment();
									}
								}}
								autoResize
								minRows={1}
								maxRows={4}
								className="flex-1"
								inputProps={{
									className:
										"bg-[var(--feed-inset)] text-[12px] text-[var(--feed-ink)] placeholder:text-[var(--feed-ink-dim)]",
								}}
							/>
							<Button
								variant="subtle"
								size="xs"
								disabled={!commentText.trim() || createComment.isPending}
								loading={createComment.isPending}
								onClick={handleComment}
								className="shrink-0 rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)] disabled:cursor-not-allowed disabled:opacity-40"
							>
								<Send size={14} aria-hidden="true" />
							</Button>
						</div>
					)}

					{!session && (
						<p className="m-0 text-[12px] text-[var(--feed-ink-dim)]">
							Sign in to comment.
						</p>
					)}

					{comments && comments.length > 0 && (
						<div className="mt-3 space-y-3">
							{comments.map((comment) => {
								const isAuthor = session?.user?.id === comment.author.id;
								const editable =
									isAuthor &&
									canEditComment(comment.author.id, comment.createdAt);
								const isEditing = editingCommentId === comment.id;

								return (
									<div key={comment.id} className="flex gap-2">
										<Avatar
											name={comment.author.name}
											tone={toneForId(comment.author.id)}
											size={28}
										/>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
												<span className="text-[12px] font-semibold text-[var(--feed-ink)]">
													{comment.author.name}
												</span>
												<span className="text-[11px] text-[var(--feed-ink-dim)]">
													{formatRelativeTime(comment.createdAt)}
												</span>

												{isEditing ? (
													<div className="ml-auto flex gap-1">
														<Button
															variant="subtle"
															size="xs"
															leftSection={
																<Check size={12} aria-hidden="true" />
															}
															disabled={updateComment.isPending}
															loading={updateComment.isPending}
															onClick={() => {
																if (
																	editCommentText.trim() === comment.content
																) {
																	setEditingCommentId(null);
																	return;
																}
																updateComment.mutate(
																	{
																		postId: post.id,
																		commentId: comment.id,
																		content: editCommentText.trim(),
																	},
																	{
																		onSettled: () => setEditingCommentId(null),
																	},
																);
															}}
															className="rounded-full p-0 h-5 w-5 text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)]"
														/>
														<Button
															variant="subtle"
															size="xs"
															leftSection={<X size={12} aria-hidden="true" />}
															onClick={() => {
																setEditingCommentId(null);
																setEditCommentText("");
															}}
															className="rounded-full p-0 h-5 w-5 text-[var(--feed-ink-dim)] hover:text-[var(--feed-ink)]"
														/>
													</div>
												) : (
													editable && (
														<Menu position="bottom-end" shadow="xs" width={140}>
															<Menu.Target>
																<button
																	type="button"
																	aria-label="Comment actions"
																	className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded text-[var(--feed-ink-dim)] transition hover:bg-[var(--feed-hover)] hover:text-[var(--feed-ink)]"
																>
																	<MoreHorizontal
																		size={12}
																		aria-hidden="true"
																	/>
																</button>
															</Menu.Target>
															<Menu.Dropdown>
																<Menu.Item
																	leftSection={
																		<Edit size={12} aria-hidden="true" />
																	}
																	onClick={() => {
																		setEditingCommentId(comment.id);
																		setEditCommentText(comment.content);
																	}}
																>
																	Edit
																</Menu.Item>
																<Menu.Item
																	color="red"
																	leftSection={
																		<Trash2 size={12} aria-hidden="true" />
																	}
																	onClick={() => {
																		deleteComment.mutate({
																			postId: post.id,
																			commentId: comment.id,
																		});
																	}}
																>
																	Delete
																</Menu.Item>
															</Menu.Dropdown>
														</Menu>
													)
												)}
											</div>

											{isEditing ? (
												<Textarea
													value={editCommentText}
													onChange={(e) => setEditCommentText(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter" && !e.shiftKey) {
															e.preventDefault();
															if (editCommentText.trim()) {
																updateComment.mutate(
																	{
																		postId: post.id,
																		commentId: comment.id,
																		content: editCommentText.trim(),
																	},
																	{
																		onSettled: () => setEditingCommentId(null),
																	},
																);
															}
														}
													}}
													autoResize
													minRows={1}
													maxRows={3}
													className="mt-1"
													inputProps={{
														className:
															"bg-[var(--feed-inset)] text-[12px] text-[var(--feed-ink)] placeholder:text-[var(--feed-ink-dim)]",
													}}
												/>
											) : (
												<p className="m-0 text-[12px] text-[var(--feed-ink-soft)]">
													{comment.content}
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}
		</article>
	);
}
