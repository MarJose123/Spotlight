/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import {
	Button,
	Group,
	HoverCard,
	Menu,
	Modal,
	Skeleton,
	Stack,
	Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { RichTextEditor } from "@mantine/tiptap";
import { Link as RouterLink } from "@tanstack/react-router";
import { InputRule } from "@tiptap/core";
import Emoji, { gitHubEmojis } from "@tiptap/extension-emoji";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import {
	Calendar,
	Check,
	Edit,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Send,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "#/lib/api/client";
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
import type { Session } from "#/lib/session";
import type { AvatarTone, FeedPost } from "../../lib/feed-data";
import { Avatar, MediaGrid, toneGradient } from "./media";
import { TiptapRenderer } from "./TiptapRenderer";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

// Build an emoticon map for quick lookup (emoticon -> emoji name).
const emoticonMap = (() => {
	const map = new Map<string, string>();
	for (const emoji of gitHubEmojis) {
		if (emoji.emoticons) {
			for (const emoticon of emoji.emoticons) {
				map.set(emoticon, emoji.name);
			}
		}
	}
	return map;
})();

// Build regex that matches emoticons without requiring a trailing space.
// Sorted longest-first so "<3" matches before "<" if both existed.
// Capture the leading space in group 1 and the emoticon in group 2,
// so the handler can preserve the space.
const emoticonRegex = (() => {
	const emoticons = Array.from(emoticonMap.keys()).sort(
		(a, b) => b.length - a.length,
	);
	if (emoticons.length === 0) return null;
	const escaped = emoticons.map((e) =>
		e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
	);
	return new RegExp(`(^|\\s)(${escaped.join("|")})$`);
})();

const commentEditorExtensions = [
	StarterKit.configure({
		bulletList: false,
		orderedList: false,
		blockquote: false,
		horizontalRule: false,
		codeBlock: false,
		hardBreak: false,
	}),
	Mention.configure({
		HTMLAttributes: { class: "mention" },
		renderText: (props) =>
			`@${props.node.attrs.label ?? props.node.attrs.id ?? ""}`,
	}),
	Emoji.configure({
		emojis: gitHubEmojis,
		forceFallbackImages: true,
	}).extend({
		addInputRules() {
			const inputRules = [...(this.parent?.() ?? [])];

			// Add a custom input rule that converts emoticons without
			// requiring a trailing space — the built-in rule needs ` $`
			// at the end, so typing "<3" and pressing Enter never fires.
			if (emoticonRegex) {
				inputRules.push(
					new InputRule({
						find: emoticonRegex,
						handler: ({ range, match, chain }) => {
							// match[1] is the leading space (or empty at start),
							// match[2] is the emoticon itself.
							const prefix = match[1];
							const emoticon = match[2];
							const emojiName = emoticonMap.get(emoticon);
							if (!emojiName) return;

							// Only replace the emoticon portion, preserving the
							// leading space so "test <3" becomes "test ❤️".
							const emoticonFrom = range.from + prefix.length;
							const emoticonTo = range.to;

							chain()
								.insertContentAt(
									{ from: emoticonFrom, to: emoticonTo },
									{
										type: "emoji",
										attrs: { name: emojiName },
									},
								)
								.command(({ tr, state }) => {
									tr.setStoredMarks(
										state.doc.resolve(state.selection.to - 1).marks(),
									);
									return true;
								})
								.run();
						},
					}),
				);
			}

			return inputRules;
		},
	}),
];

function canEditPost(viewerId: string, post: FeedPost): boolean {
	if (viewerId !== post.authorId) return false;
	const age = Date.now() - new Date(post.createdAt).getTime();
	return age >= 0 && age <= EDIT_WINDOW_MS;
}

function canEditComment(_authorId: string, createdAt: string): boolean {
	const age = Date.now() - new Date(createdAt).getTime();
	return age >= 0 && age <= EDIT_WINDOW_MS;
}

/** Check if a Tiptap editor has any meaningful content (text, mentions, emojis). */
function hasContent(editor: ReturnType<typeof useEditor> | null): boolean {
	if (!editor) return false;
	const { doc } = editor.state;
	let hasText = false;
	doc.descendants((node) => {
		if (node.isText && node.text?.trim()) hasText = true;
		if (node.type.name === "mention") hasText = true;
		if (node.type.name === "emoji") hasText = true;
	});
	return hasText;
}

/** Inline Tiptap editor for creating a new comment. */
interface NewCommentEditorProps {
	onSubmit: (contentJson: string) => void;
	isSubmitting: boolean;
	user: {
		id: string;
		name: string;
		avatarUrl?: string;
	};
}

function NewCommentEditor({
	onSubmit,
	isSubmitting,
	user,
}: NewCommentEditorProps) {
	const editor = useEditor({
		content: "",
		extensions: [
			...commentEditorExtensions,
			Placeholder.configure({
				placeholder: "Write a comment...",
			}),
		],
		editorProps: {
			attributes: {
				class:
					"block w-full resize-none bg-transparent p-0 text-[11px] leading-[1.1] text-[var(--feed-ink)] outline-none [overflow-wrap:anywhere] min-h-[16px]",
			},
		},
	});

	const [hasText, setHasText] = useState(false);
	useEffect(() => {
		if (!editor) return;
		const handler = () => setHasText(hasContent(editor));
		setHasText(hasContent(editor));
		editor.on("update", handler);
		return () => {
			editor.off("update", handler);
		};
	}, [editor]);

	const handleSubmit = useCallback(() => {
		if (editor && hasContent(editor)) {
			onSubmit(JSON.stringify(editor.getJSON()));
			editor.commands.clearContent();
		}
	}, [editor, onSubmit]);

	return (
		<div className="flex items-center gap-1.5">
			<Avatar name={user.name} tone={toneForId(user.id)} size={28} />
			<div className="min-w-0 flex-1">
				{editor && (
					<RichTextEditor editor={editor} style={{ padding: 0, margin: 0 }}>
						<RichTextEditor.Content />
					</RichTextEditor>
				)}
			</div>
			<Button
				variant="subtle"
				size="xs"
				disabled={!hasText || isSubmitting}
				loading={isSubmitting}
				onClick={handleSubmit}
				className="shrink-0 rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)] disabled:cursor-not-allowed disabled:opacity-40"
			>
				<Send size={14} aria-hidden="true" />
			</Button>
		</div>
	);
}

/** Inline Tiptap editor for editing an existing comment. */
interface EditCommentEditorProps {
	contentJson: string;
	onSave: (contentJson: string) => void;
	onCancel: () => void;
	isSaving: boolean;
}

function EditCommentEditor({
	contentJson,
	onSave,
	onCancel,
	isSaving,
}: EditCommentEditorProps) {
	const originalContent = JSON.parse(contentJson);
	const [hasChanges, setHasChanges] = useState(false);

	const editor = useEditor({
		content: originalContent,
		extensions: commentEditorExtensions,
		editorProps: {
			attributes: {
				class:
					"block w-full rounded-xl border border-[var(--feed-line)] bg-[var(--feed-inset)] px-3 py-2 text-[12px] leading-[1.35] text-[var(--feed-ink)] focus:border-[var(--feed-ink-soft)] focus:outline-none [overflow-wrap:anywhere]",
			},
		},
	});

	useEffect(() => {
		if (!editor) return;
		editor.commands.focus("end");
		const handler = () => {
			setHasChanges(
				JSON.stringify(editor.getJSON()) !== JSON.stringify(originalContent),
			);
		};
		handler();
		editor.on("update", handler);
		return () => {
			editor.off("update", handler);
		};
	}, [editor, originalContent]);

	const handleSave = useCallback(() => {
		if (editor && hasChanges) {
			onSave(JSON.stringify(editor.getJSON()));
		}
	}, [editor, hasChanges, onSave]);

	return (
		<div className="mt-1 space-y-1.5">
			<EditorContent editor={editor} />
			<div className="flex gap-2">
				<Button
					variant="subtle"
					size="xs"
					leftSection={<Check size={12} aria-hidden="true" />}
					disabled={!hasChanges || isSaving}
					loading={isSaving}
					onClick={handleSave}
					className="rounded-full text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)]"
				>
					Save
				</Button>
				<Button
					variant="subtle"
					size="xs"
					leftSection={<X size={12} aria-hidden="true" />}
					onClick={onCancel}
					className="rounded-full text-[12px] font-semibold text-[var(--feed-ink-dim)] hover:text-[var(--feed-ink)]"
				>
					Cancel
				</Button>
			</div>
		</div>
	);
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
dayjs.extend(advancedFormat);

/** Format an ISO timestamp as a relative string ("3 minutes ago", "2 hours ago"). */
function formatRelativeTime(iso: string): string {
	return dayjs(iso).fromNow();
}

/** Format an ISO timestamp as a human-readable absolute date and time. */
function formatAbsoluteTime(iso: string): string {
	return dayjs(iso).format("MMMM D, YYYY h:mm A");
}

interface EditPostEditorProps {
	postId: string;
	contentJson: string;
	onSave: (contentJson: string) => void;
	onCancel: () => void;
	isSaving: boolean;
}

function EditPostEditor({
	contentJson,
	onSave,
	onCancel,
	isSaving,
}: EditPostEditorProps) {
	const originalContent = JSON.parse(contentJson);
	const [hasChanges, setHasChanges] = useState(false);

	const editor = useEditor({
		content: originalContent,
		extensions: [
			StarterKit.configure({
				bulletList: false,
				orderedList: false,
				blockquote: false,
				horizontalRule: false,
				codeBlock: false,
				hardBreak: false,
			}),
			Mention.configure({
				HTMLAttributes: { class: "mention" },
				renderText: (props) =>
					`@${props.node.attrs.label ?? props.node.attrs.id ?? ""}`,
			}),
			Emoji.configure({
				emojis: gitHubEmojis,
				forceFallbackImages: true,
			}),
		],
		editorProps: {
			attributes: {
				class:
					"block w-full rounded-xl border border-[var(--feed-line)] bg-[var(--feed-inset)] px-3 py-2 text-[12px] leading-[1.35] text-[var(--feed-ink)] focus:border-[var(--feed-ink-soft)] focus:outline-none [overflow-wrap:anywhere]",
			},
		},
	});

	useEffect(() => {
		if (!editor) return;
		editor.commands.focus("end");
		const handler = () => {
			setHasChanges(
				JSON.stringify(editor.getJSON()) !== JSON.stringify(originalContent),
			);
		};
		handler();
		editor.on("update", handler);
		return () => {
			editor.off("update", handler);
		};
	}, [editor, originalContent]);

	const handleSave = useCallback(() => {
		if (editor && hasChanges) {
			onSave(JSON.stringify(editor.getJSON()));
		}
	}, [editor, hasChanges, onSave]);

	return (
		<div className="space-y-2">
			<EditorContent editor={editor} />
			<div className="flex gap-2">
				<Button
					variant="subtle"
					size="xs"
					leftSection={<Check size={12} aria-hidden="true" />}
					disabled={!hasChanges || isSaving}
					loading={isSaving}
					onClick={handleSave}
					className="rounded-full text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)]"
				>
					Save
				</Button>
				<Button
					variant="subtle"
					size="xs"
					leftSection={<X size={12} aria-hidden="true" />}
					onClick={onCancel}
					className="rounded-full text-[12px] font-semibold text-[var(--feed-ink-dim)] hover:text-[var(--feed-ink)]"
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}

export function PostCard({
	post,
	viewerId,
	session,
}: {
	post: FeedPost;
	viewerId: string;
	session: Session | null;
}) {
	const [commentOpen, setCommentOpen] = useState(false);
	const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
	const [editingPost, setEditingPost] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deleteCommentConfirmOpen, setDeleteCommentConfirmOpen] =
		useState(false);
	const [deletingCommentId, setDeletingCommentId] = useState({
		postId: "",
		commentId: "",
	});
	const [likesModalOpen, setLikesModalOpen] = useState(false);

	const toggleLike = useToggleLike();
	const createComment = useCreateComment();
	const updateComment = useUpdateComment();
	const deleteComment = useDeleteComment();
	const updatePostMutation = useUpdatePost();
	const deletePostMutation = useDeletePost();
	const { data: comments } = useComments(post.id);
	// Defer loading likers until the modal opens — avoids one query per post on feed load.
	const { data: likers, isLoading: likersLoading } = usePostLikes(post.id, {
		enabled: likesModalOpen,
	});

	const isLiked = post.reactions.some((r) => r.id === viewerId);
	const likeCount = parseInt(post.reactionCount, 10) || 0;
	const commentCount = parseInt(post.commentCount, 10) || 0;

	const handleLike = useCallback(() => {
		if (!session) return;
		toggleLike.mutate(
			{
				postId: post.id,
				userId: session.user?.id ?? viewerId,
			},
			{
				onError: (error) => {
					const message =
						error instanceof ApiError
							? error.message
							: "Could not update like. Please try again.";
					notifications.show({
						title: "Like failed",
						message,
						color: "red",
						autoClose: 5000,
					});
				},
			},
		);
	}, [session, post.id, viewerId, toggleLike]);

	const handleComment = useCallback(
		(contentJson: string) => {
			createComment.mutate(
				{ postId: post.id, contentJson },
				{
					onError: (error) => {
						const message =
							error instanceof ApiError
								? error.message
								: "Could not post comment. Please try again.";
						notifications.show({
							title: "Comment failed",
							message,
							color: "red",
							autoClose: 5000,
						});
					},
				},
			);
		},
		[post.id, createComment],
	);

	const hasEngagement = post.reactions.length > 0 || likeCount > 0;
	const editable = canEditPost(viewerId, post);
	const displayCommentCount = comments ? comments.length : commentCount;

	return (
		<article className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
			<header className="flex items-start gap-3">
				<Avatar name={post.author.name} tone={post.author.tone} size={38} />

				<div className="min-w-0 flex-1">
					<HoverCard
						width="auto"
						position="bottom-start"
						withArrow
						shadow="md"
						offset={6}
					>
						<HoverCard.Target>
							<RouterLink
								to="/users"
								search={{ search: post.author.name }}
								className="truncate text-[13px] font-bold text-[var(--feed-ink)] hover:underline"
							>
								{post.author.name}
							</RouterLink>
						</HoverCard.Target>
						<HoverCard.Dropdown className="w-[220px] rounded-xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-3 shadow-lg">
							<div className="flex items-center gap-2.5">
								<Avatar
									name={post.author.name}
									tone={post.author.tone}
									size={32}
								/>
								<div className="min-w-0">
									<p className="m-0 truncate text-[13px] font-bold text-[var(--feed-ink)]">
										{post.author.name}
									</p>
									{post.author.email && (
										<p className="m-0 truncate text-[11px] text-[var(--feed-ink-dim)]">
											{post.author.email}
										</p>
									)}
								</div>
							</div>
							<div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[var(--feed-ink-soft)]">
								<Calendar size={12} aria-hidden={true} />
								<span>{formatAbsoluteTime(post.createdAt)}</span>
							</div>
						</HoverCard.Dropdown>
					</HoverCard>
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
								onClick={() => setEditingPost(true)}
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
				opened={deleteCommentConfirmOpen}
				onClose={() => setDeleteCommentConfirmOpen(false)}
				title="Delete comment"
				size="sm"
				centered
			>
				<p className="text-[13px] text-[var(--feed-ink)]">
					Are you sure you want to delete this comment? This action cannot be
					undone.
				</p>
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant="subtle"
						size="xs"
						onClick={() => setDeleteCommentConfirmOpen(false)}
						className="rounded-full text-[12px] font-semibold text-[var(--feed-ink-dim)] hover:text-[var(--feed-ink)]"
					>
						Cancel
					</Button>
					<Button
						color="red"
						size="xs"
						loading={deleteComment.isPending}
						disabled={deleteComment.isPending}
						onClick={() => {
							deleteComment.mutate(
								{
									postId: deletingCommentId.postId,
									commentId: deletingCommentId.commentId,
								},
								{
									onSuccess: () => {
										notifications.show({
											title: "Comment deleted",
											message: "Your comment has been deleted.",
											color: "teal",
											autoClose: 3000,
										});
									},
									onError: (error) => {
										const message =
											error instanceof ApiError
												? error.message
												: "Could not delete comment. Please try again.";
										notifications.show({
											title: "Delete failed",
											message,
											color: "red",
											autoClose: 5000,
										});
									},
									onSettled: () => setDeleteCommentConfirmOpen(false),
								},
							);
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
				size="sm"
				centered
				withCloseButton
				title={
					<Group gap="xs">
						<Heart
							size={16}
							style={{ color: "#e0245e" }}
							fill="#e0245e"
							aria-hidden="true"
						/>
						<Text size="sm" fw={600} className="text-[var(--feed-ink)]">
							{likeCount} {likeCount === 1 ? "Like" : "Likes"}
						</Text>
					</Group>
				}
			>
				{likersLoading ? (
					<Stack gap="sm">
						{[0, 1, 2].map((i) => (
							<div key={i} className="flex items-center gap-3">
								<Skeleton height={32} width={32} circle />
								<div className="min-w-0 flex-1 space-y-1.5">
									<Skeleton height={14} width="70%" />
								</div>
							</div>
						))}
					</Stack>
				) : likers && likers.length > 0 ? (
					<Stack gap="xs" className="max-h-[60vh] overflow-y-auto">
						{likers.map((liker) => {
							const isCurrentUser = liker.id === viewerId;
							return (
								<div
									key={liker.id}
									className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
										isCurrentUser
											? "bg-[var(--feed-inset)]"
											: "hover:bg-[var(--feed-hover)]"
									}`}
								>
									<Avatar
										name={liker.name}
										tone={toneForId(liker.id)}
										size={36}
									/>
									<div className="min-w-0 flex-1">
										<span className="block truncate text-[13px] font-semibold text-[var(--feed-ink)]">
											{liker.name}
										</span>
										{isCurrentUser && (
											<span className="text-[11px] text-[var(--feed-ink-dim)]">
												You
											</span>
										)}
									</div>
									<Heart
										size={14}
										style={{ color: "#e0245e" }}
										fill="#e0245e"
										aria-hidden="true"
									/>
								</div>
							);
						})}
					</Stack>
				) : (
					<div className="py-6 text-center">
						<Heart
							size={32}
							className="mx-auto mb-2 opacity-30"
							style={{ color: "var(--feed-ink-dim)" }}
							aria-hidden="true"
						/>
						<Text
							size="sm"
							c="var(--feed-ink-dim)"
							className="text-[var(--feed-ink-dim)]"
						>
							No likes yet.
						</Text>
						<Text
							size="xs"
							c="var(--feed-ink-dim)"
							className="text-[var(--feed-ink-dim)]"
						>
							Be the first to like this post.
						</Text>
					</div>
				)}
			</Modal>

			{editingPost ? (
				<div className="mt-2.5 space-y-2">
					<EditPostEditor
						postId={post.id}
						contentJson={post.contentJson}
						onSave={(contentJson) => {
							updatePostMutation.mutate(
								{ postId: post.id, contentJson },
								{
									onSuccess: () => {
										notifications.show({
											title: "Post updated",
											message: "Your post has been updated.",
											color: "teal",
											autoClose: 3000,
										});
									},
									onError: (error) => {
										const message =
											error instanceof ApiError
												? error.message
												: "Could not update post. Please try again.";
										notifications.show({
											title: "Update failed",
											message,
											color: "red",
											autoClose: 5000,
										});
									},
									onSettled: () => setEditingPost(false),
								},
							);
						}}
						onCancel={() => setEditingPost(false)}
						isSaving={updatePostMutation.isPending}
					/>
				</div>
			) : (
				<div className="mt-2.5">
					<TiptapRenderer contentJson={post.contentJson} />
				</div>
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

							{/* biome-ignore lint/a11y/useSemanticElements: span used to avoid native button font-size defaults */}
							<span
								role="button"
								tabIndex={0}
								onClick={() => setLikesModalOpen(true)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										setLikesModalOpen(true);
									}
								}}
								className="text-[12px] text-[var(--feed-ink-soft)] hover:underline cursor-pointer bg-transparent border-none p-0 m-0 font-inherit leading-inherit"
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
					{session?.user && (
						<NewCommentEditor
							onSubmit={handleComment}
							isSubmitting={createComment.isPending}
							user={{
								id: session.user.id,
								name: session.user.displayName ?? session.user.name,
								avatarUrl: session.user.avatarUrl,
							}}
						/>
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
												{!isEditing && editable && (
													<Menu position="bottom-end" shadow="xs" width={140}>
														<Menu.Target>
															<button
																type="button"
																aria-label="Comment actions"
																className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded text-[var(--feed-ink-dim)] transition hover:bg-[var(--feed-hover)] hover:text-[var(--feed-ink)]"
															>
																<MoreHorizontal size={12} aria-hidden="true" />
															</button>
														</Menu.Target>
														<Menu.Dropdown>
															<Menu.Item
																leftSection={
																	<Edit size={12} aria-hidden="true" />
																}
																onClick={() => {
																	setEditingCommentId(comment.id);
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
																	setDeletingCommentId({
																		postId: post.id,
																		commentId: comment.id,
																	});
																	setDeleteCommentConfirmOpen(true);
																}}
															>
																Delete
															</Menu.Item>
														</Menu.Dropdown>
													</Menu>
												)}
											</div>

											{isEditing ? (
												<EditCommentEditor
													contentJson={comment.contentJson}
													onSave={(contentJson) => {
														updateComment.mutate(
															{
																postId: post.id,
																commentId: comment.id,
																contentJson,
															},
															{
																onError: (error) => {
																	const message =
																		error instanceof ApiError
																			? error.message
																			: "Could not update comment. Please try again.";
																	notifications.show({
																		title: "Update failed",
																		message,
																		color: "red",
																		autoClose: 5000,
																	});
																},
																onSettled: () => setEditingCommentId(null),
															},
														);
													}}
													onCancel={() => setEditingCommentId(null)}
													isSaving={updateComment.isPending}
												/>
											) : (
												<div className="mt-1">
													<TiptapRenderer contentJson={comment.contentJson} />
												</div>
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
