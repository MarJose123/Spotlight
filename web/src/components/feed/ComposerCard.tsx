/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Button, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Lightbox, type LightboxSlideData } from "@mantine/lightbox";
import { notifications } from "@mantine/notifications";
import { RichTextEditor } from "@mantine/tiptap";
import { InputRule } from "@tiptap/core";
import Emoji, { gitHubEmojis } from "@tiptap/extension-emoji";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { ReactRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { exitSuggestion } from "@tiptap/suggestion";
import { Film, Image, Send, X } from "lucide-react";
import {
	Fragment,
	forwardRef,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { ApiError } from "#/lib/api/client";
import type { GiphyGif } from "#/lib/api/gif";
import { useCreatePost, useUsers } from "#/lib/api-queries";
import type { AvatarTone, FeedViewer } from "#/lib/feed-data";
import { COMPOSER_ACTIONS } from "#/lib/feed-data";
import { readSession } from "#/lib/session";
import { GifPicker } from "./GifPicker";
import { Avatar, ComposerPhotoPreview, ComposerVideoPreview } from "./media";

/** Longest commendation a single post accepts. */
const MAX_LENGTH = 250;

/** Warn once the writer is this close to the cap. */
const WARN_REMAINING = 20;

const ACTION_ICONS = {
	photo: { Icon: Image, color: "#22c55e" },
	video: { Icon: Film, color: "#3b82f6" },
	gif: { Icon: Film, color: "#6366f1" },
} as const;

/** Maximum number of photos a single post accepts. */
const MAX_PHOTOS = 5;

/** Maximum number of videos a single post accepts. */
const MAX_VIDEOS = 1;

/** Image MIME types the composer accepts. */
const IMAGE_MIME_TYPES = "image/jpeg,image/png,image/webp";

/** Video MIME types the composer accepts. */
const VIDEO_MIME_TYPES = "video/mp4,video/webm,video/quicktime";

/**
 * Count characters in the editor content. Each mention counts as 1 character
 * since it represents a single user reference.
 */
function countCharacters(editor: ReturnType<typeof useEditor> | null): number {
	if (!editor) return 0;
	const { doc } = editor.state;
	let count = 0;

	doc.descendants((node) => {
		if (node.type.name === "mention") {
			count += 1;
		} else if (node.type.name === "emoji") {
			count += (node.attrs.name ?? "").length;
		} else if (node.isText) {
			count += (node.text ?? "").length;
		}
	});
	return count;
}

/** Derive a stable avatar tone from a user id so the same user always renders the same colour. */
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

// ── React-based mention suggestion dropdown ──────────────────────────────────

interface MentionItem {
	id: string | null;
	label?: string | null;
	avatarUrl?: string | null;
}

interface MentionListProps {
	items: MentionItem[];
	command: (item: MentionItem) => void;
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
}

const MentionList = forwardRef<HTMLDivElement, MentionListProps>(
	({ items, command, selectedIndex, setSelectedIndex }, ref) => {
		return (
			<div
				ref={ref}
				className="z-[10000] max-w-[280px] min-w-[200px] rounded-lg border border-[var(--feed-line)] bg-[var(--feed-card)] shadow-lg"
			>
				<ScrollArea mah={200}>
					{items.length === 0 ? (
						<div className="px-3 py-2 text-xs text-[var(--feed-ink-dim)]">
							No users found
						</div>
					) : (
						items.map((item, index) => (
							<button
								key={item.id ?? `mention-${index}`}
								type="button"
								className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${
									index === selectedIndex
										? "bg-[var(--feed-inset)] font-semibold text-[var(--feed-ink)]"
										: "text-[var(--feed-ink-soft)]"
								}`}
								onClick={() => command(item)}
								onMouseEnter={() => setSelectedIndex(index)}
							>
								<Avatar
									name={item.label ?? item.id ?? "?"}
									tone={toneForId(item.id ?? "")}
									size={24}
								/>
								<span className="text-xs">{item.label ?? item.id ?? ""}</span>
							</button>
						))
					)}
				</ScrollArea>
			</div>
		);
	},
);
MentionList.displayName = "MentionList";

function buildMentionSuggestion(
	users: () => MentionItem[],
): Omit<SuggestionOptions<MentionItem, MentionItem>, "editor"> {
	return {
		char: "@",
		allowedPrefixes: null,
		command: ({ editor, range, props }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContentAt(range, {
					type: "mention",
					attrs: {
						id: props.id,
						label: props.label,
						mentionSuggestionChar: "@",
					},
				})
				.run();
		},
		items: ({ query }) => {
			const list = users();
			if (!query) return list.slice(0, 5);
			const q = query.toLowerCase();
			return list
				.filter(
					(u) =>
						(u.label ?? "").toLowerCase().includes(q) ||
						(u.id ?? "").toLowerCase().includes(q),
				)
				.slice(0, 5);
		},
		render: () => {
			let reactRenderer: ReactRenderer | null = null;
			let unmount: (() => void) | null = null;
			let selectedIndex = 0;
			let currentItems: MentionItem[] = [];
			let currentCommand: ((item: MentionItem) => void) | null = null;

			const setSelectedIndex = (index: number) => {
				selectedIndex = index;
				reactRenderer?.updateProps({ selectedIndex: index });
			};

			return {
				onStart: (props) => {
					selectedIndex = 0;
					currentItems = props.items;
					currentCommand = props.command;
					reactRenderer = new ReactRenderer(MentionList, {
						props: {
							items: props.items,
							command: props.command,
							selectedIndex,
							setSelectedIndex,
						},
						editor: props.editor,
					});
					unmount = props.mount(reactRenderer.element);
				},
				onUpdate: (props) => {
					selectedIndex = 0;
					currentItems = props.items;
					currentCommand = props.command;
					reactRenderer?.updateProps({
						items: props.items,
						command: props.command,
						selectedIndex,
						setSelectedIndex,
					});
				},
				onExit: () => {
					unmount?.();
					reactRenderer?.destroy();
					unmount = null;
					reactRenderer = null;
				},
				onKeyDown: ({ view, event }) => {
					if (event.key === "Escape") {
						exitSuggestion(view);
						return true;
					}
					if (
						event.key === "Enter" &&
						currentItems.length > 0 &&
						currentCommand
					) {
						currentCommand(currentItems[selectedIndex]);
						return true;
					}
					if (event.key === "ArrowDown" && currentItems.length > 0) {
						event.preventDefault();
						const nextIndex = (selectedIndex + 1) % currentItems.length;
						setSelectedIndex(nextIndex);
						return true;
					}
					if (event.key === "ArrowUp" && currentItems.length > 0) {
						event.preventDefault();
						const prevIndex =
							(selectedIndex - 1 + currentItems.length) % currentItems.length;
						setSelectedIndex(prevIndex);
						return true;
					}
					return false;
				},
			};
		},
	};
}

export function ComposerCard({ viewer }: { viewer: FeedViewer }) {
	const [photos, setPhotos] = useState<
		Array<{ id: string; file: File; preview: string }>
	>([]);
	const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(
		null,
	);
	const [videos, setVideos] = useState<
		Array<{ id: string; file: File; preview: string }>
	>([]);
	const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
	const [gifOpened, gifHandlers] = useDisclosure(false);
	const counterId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);
	const { mutate: createPost, isPending } = useCreatePost();
	const { data: allUsers = [] } = useUsers();

	// Convert API users to mention-compatible format
	const mentionUsers: MentionItem[] = useMemo(
		() =>
			allUsers
				.filter((u) => u.id !== viewer.id)
				.map((u) => ({
					id: u.id,
					label: u.displayName ?? u.username ?? u.name,
					avatarUrl: u.avatarUrl ?? null,
				})),
		[allUsers, viewer.id],
	);

	// Ref to access mentionUsers in the suggestion callback
	const mentionUsersRef = useRef(mentionUsers);
	mentionUsersRef.current = mentionUsers;

	// Build an emoticon map for quick lookup (emoticon -> emoji name)
	const emoticonMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const emoji of gitHubEmojis) {
			if (emoji.emoticons) {
				for (const emoticon of emoji.emoticons) {
					map.set(emoticon, emoji.name);
				}
			}
		}
		return map;
	}, []);

	// Build regex that matches emoticons without requiring a trailing space.
	// Sorted longest-first so "<3" matches before "<" if both existed.
	// Capture the leading space in group 1 and the emoticon in group 2,
	// so the handler can preserve the space.
	const emoticonRegex = useMemo(() => {
		const emoticons = Array.from(emoticonMap.keys()).sort(
			(a, b) => b.length - a.length,
		);
		if (emoticons.length === 0) return null;
		const escaped = emoticons.map((e) =>
			e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
		);
		return new RegExp(`(^|\\s)(${escaped.join("|")})$`);
	}, [emoticonMap]);

	// Build the Tiptap editor with Mention extension
	const editor = useEditor({
		content: "",
		extensions: [
			StarterKit.configure({
				bulletList: false,
				orderedList: false,
				blockquote: false,
				horizontalRule: false,
				codeBlock: false,
				code: false,
				hardBreak: false,
			}),
			Placeholder.configure({
				placeholder: "Recognize someone today...",
			}),
			Mention.configure({
				HTMLAttributes: {
					class: "mention",
				},
				renderText: (props) =>
					`@${props.node.attrs.label ?? props.node.attrs.id ?? ""}`,
				suggestion: buildMentionSuggestion(() => mentionUsersRef.current),
			}),
			Emoji.configure({
				enableEmoticons: false,
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
		],
		editorProps: {
			attributes: {
				class:
					"block w-full resize-none bg-transparent pt-2 pb-1 text-[12px] leading-[1.35] text-[var(--feed-ink)] outline-none [overflow-wrap:anywhere]",
			},
		},
	});

	// Track character count — re-compute on every editor update so React
	// re-renders and the composer actions appear when typing.
	const [charCount, setCharCount] = useState(0);
	useEffect(() => {
		if (!editor) return;
		const handler = () => setCharCount(countCharacters(editor));
		setCharCount(countCharacters(editor));
		editor.on("update", handler);
		return () => {
			editor.off("update", handler);
		};
	}, [editor]);
	const remaining = MAX_LENGTH - charCount;

	const handleSubmit = useCallback(() => {
		const session = readSession();
		if (!session) {
			return;
		}

		const contentJson = editor?.getJSON()
			? JSON.stringify(editor.getJSON())
			: undefined;
		const hasFiles = photos.length > 0 || videos.length > 0;
		const attachmentType =
			videos.length > 0
				? "video"
				: photos.length > 0
					? "image"
					: selectedGif !== null
						? "gif"
						: "text";

		createPost(
			{
				contentJson: contentJson ?? "",
				attachmentType,
				files: hasFiles
					? [...photos.map((p) => p.file), ...videos.map((v) => v.file)]
					: undefined,
				gifUrl: selectedGif?.url,
			},
			{
				onSuccess: () => {
					editor?.commands.clearContent();
					setPhotos([]);
					setVideos([]);
					setSelectedGif(null);
				},
				onError: (error) => {
					const message =
						error instanceof ApiError
							? error.message
							: "Could not create post. Please try again.";
					notifications.show({
						title: "Post failed",
						message,
						color: "red",
						autoClose: 5000,
					});
				},
			},
		);
	}, [photos, videos, selectedGif, createPost, editor]);

	const active =
		charCount > 0 ||
		photos.length > 0 ||
		videos.length > 0 ||
		selectedGif !== null;

	const counterTone =
		remaining <= 0
			? "text-[var(--feed-danger)]"
			: remaining <= WARN_REMAINING
				? "text-[var(--feed-warn)]"
				: "text-[var(--feed-ink-dim)]";

	// Revoke object URLs that were removed since the last render.
	const prevPhotosRef = useRef(photos);
	const prevVideosRef = useRef(videos);
	useEffect(() => {
		const currentPhotoIds = new Set(photos.map((p) => p.id));
		const currentVideoIds = new Set(videos.map((v) => v.id));
		for (const photo of prevPhotosRef.current) {
			if (!currentPhotoIds.has(photo.id)) {
				URL.revokeObjectURL(photo.preview);
			}
		}
		for (const video of prevVideosRef.current) {
			if (!currentVideoIds.has(video.id)) {
				URL.revokeObjectURL(video.preview);
			}
		}
		prevPhotosRef.current = photos;
		prevVideosRef.current = videos;
	}, [photos, videos]);

	const handlePhotoSelect = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const files = event.target.files;
			if (!files || files.length === 0) return;

			const fileArray = Array.from(files);

			setPhotos((current) => {
				const remaining = MAX_PHOTOS - current.length;
				if (remaining <= 0) return current;
				const selected = fileArray.slice(0, remaining);
				const newPhotos = selected.map((file) => ({
					id: crypto.randomUUID(),
					file,
					preview: URL.createObjectURL(file),
				}));
				return [...current, ...newPhotos];
			});

			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[],
	);

	const removePhoto = useCallback((id: string) => {
		setPhotos((current) => current.filter((p) => p.id !== id));
		setSelectedMediaIndex(null);
	}, []);

	const handleVideoSelect = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const files = event.target.files;
			if (!files || files.length === 0) return;

			const fileArray = Array.from(files);

			setVideos((current) => {
				const remaining = MAX_VIDEOS - current.length;
				if (remaining <= 0) return current;
				const selected = fileArray.slice(0, remaining);
				const newVideos = selected.map((file) => ({
					id: crypto.randomUUID(),
					file,
					preview: URL.createObjectURL(file),
				}));
				return [...current, ...newVideos];
			});

			if (videoInputRef.current) {
				videoInputRef.current.value = "";
			}
		},
		[],
	);

	const removeVideo = useCallback((id: string) => {
		setVideos((current) => current.filter((v) => v.id !== id));
		setSelectedMediaIndex(null);
	}, []);

	const slidesKey = `${photos.length}-${videos.length}-${selectedGif?.id ?? ""}-${photos.map((p) => p.preview).join(",")}-${videos.map((v) => v.preview).join(",")}`;
	const slides: LightboxSlideData[] = [
		...photos.map((photo) => ({ src: photo.preview })),
		...videos.map((v) => ({ type: "video" as const, src: v.preview })),
		...(selectedGif !== null ? [{ src: selectedGif.url }] : []),
	];

	useEffect(() => {
		if (
			selectedMediaIndex !== null &&
			(selectedMediaIndex >= slides.length || slides.length === 0)
		) {
			setSelectedMediaIndex(null);
		}
	}, [selectedMediaIndex, slides.length]);

	return (
		<Fragment>
			<section className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
				<div className="flex items-start gap-3">
					<Avatar name={viewer.name} tone={viewer.tone} size={38} />

					<div className="min-w-0 flex-1">
						{editor && (
							<RichTextEditor editor={editor} style={{ border: "none" }}>
								<RichTextEditor.Content />
							</RichTextEditor>
						)}

						{active && (
							<>
								{(photos.length > 0 ||
									videos.length > 0 ||
									selectedGif !== null) && (
									<div className="mt-3 flex flex-wrap gap-2">
										{photos.map((photo, i) => (
											<ComposerPhotoPreview
												key={photo.id}
												src={photo.preview}
												onRemove={() => removePhoto(photo.id)}
												onView={() => setSelectedMediaIndex(i)}
											/>
										))}
										{videos.map((video, i) => (
											<ComposerVideoPreview
												key={video.id}
												src={video.preview}
												onRemove={() => removeVideo(video.id)}
												onView={() => setSelectedMediaIndex(photos.length + i)}
											/>
										))}
										{selectedGif !== null && (
											<div className="group relative">
												<button
													type="button"
													onClick={() =>
														setSelectedMediaIndex(photos.length + videos.length)
													}
													className="h-24 w-32"
												>
													<img
														src={selectedGif.url}
														alt={selectedGif.title}
														className="pointer-events-none h-full w-full rounded-lg object-cover"
													/>
												</button>
												<button
													type="button"
													onClick={() => setSelectedGif(null)}
													className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--feed-danger)] text-white"
												>
													<X size={12} />
												</button>
											</div>
										)}
									</div>
								)}

								<div className="mt-3 flex flex-wrap items-center gap-2">
									<input
										type="file"
										ref={fileInputRef}
										accept={IMAGE_MIME_TYPES}
										multiple={photos.length < MAX_PHOTOS - 1}
										className="hidden"
										onChange={handlePhotoSelect}
									/>
									<input
										type="file"
										ref={videoInputRef}
										accept={VIDEO_MIME_TYPES}
										className="hidden"
										onChange={handleVideoSelect}
									/>

									{COMPOSER_ACTIONS.map((action) => {
										const { Icon, color } = ACTION_ICONS[action.id];
										const hasInput = charCount > 0;
										const photosInUse = photos.length > 0;
										const videosInUse = videos.length > 0;
										const gifsInUse = selectedGif !== null;
										const isPhotoFull =
											action.id === "photo" && photos.length >= MAX_PHOTOS;
										const isVideoFull =
											action.id === "video" && videos.length >= MAX_VIDEOS;
										const isGifFull =
											action.id === "gif" && selectedGif !== null;
										const isOtherActionInUse =
											(photosInUse && action.id !== "photo") ||
											(videosInUse && action.id !== "video") ||
											(gifsInUse && action.id !== "gif");

										return (
											<Button
												key={action.id}
												variant="subtle"
												size="xs"
												leftSection={
													<Icon
														size={14}
														style={{ color }}
														aria-hidden="true"
													/>
												}
												onClick={
													(hasInput &&
														action.id === "photo" &&
														photos.length < MAX_PHOTOS) ||
													(hasInput &&
														action.id === "video" &&
														videos.length < MAX_VIDEOS) ||
													(hasInput &&
														action.id === "gif" &&
														selectedGif === null)
														? () =>
																action.id === "photo"
																	? fileInputRef.current?.click()
																	: action.id === "video"
																		? videoInputRef.current?.click()
																		: gifHandlers.open()
														: undefined
												}
												disabled={
													!hasInput ||
													isPhotoFull ||
													isVideoFull ||
													isGifFull ||
													isOtherActionInUse
												}
												className="rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)] disabled:cursor-not-allowed disabled:opacity-40"
											>
												{action.label}
											</Button>
										);
									})}

									<div className="ml-auto flex items-center gap-2">
										<span
											id={counterId}
											className={`text-[11px] font-semibold tabular-nums ${counterTone}`}
										>
											{remaining <= 0 ? "Limit reached" : `${remaining} left`}
										</span>
										<Button
											variant="subtle"
											size="xs"
											rightSection={<Send size={14} aria-hidden="true" />}
											loading={isPending}
											disabled={
												(charCount === 0 &&
													photos.length === 0 &&
													videos.length === 0 &&
													selectedGif === null) ||
												remaining <= 0 ||
												isPending
											}
											onClick={handleSubmit}
											className="rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] text-[12px] font-semibold text-[var(--feed-ink-soft)] hover:text-[var(--feed-ink)] disabled:cursor-not-allowed disabled:opacity-40"
										>
											Post
										</Button>
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</section>
			<Lightbox
				key={slidesKey}
				opened={selectedMediaIndex !== null}
				onClose={() => setSelectedMediaIndex(null)}
				slides={slides}
				currentIndex={selectedMediaIndex ?? 0}
				onIndexChange={(index) => setSelectedMediaIndex(index)}
			/>
			<GifPicker
				opened={gifOpened}
				onClose={gifHandlers.close}
				onSelect={(gif) => {
					setSelectedGif(gif);
					gifHandlers.close();
				}}
			/>
		</Fragment>
	);
}
