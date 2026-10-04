/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Button } from "@mantine/core";
import { Film, Image, Send, Video } from "lucide-react";
import {
	Fragment,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import Lightbox, {
	type SlideImage,
	type SlideVideo,
} from "yet-another-react-lightbox";
import video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import type { FeedViewer } from "#/lib/feed-data.ts";
import { COMPOSER_ACTIONS } from "#/lib/feed-data.ts";
import { Avatar, ComposerPhotoPreview, ComposerVideoPreview } from "./media";

/** Longest commendation a single post accepts. */
const MAX_LENGTH = 250;

/**
 * Focused-but-empty height: about three text lines plus the field's padding, so
 * the box opens up instead of hugging a single row while the writer gets going.
 * `--mantine-line-height` drives the row height here (see the note on `resize`).
 */
const EXPANDED_HEIGHT = 86;

/** Past this the field scrolls instead of pushing the feed down. */
const MAX_HEIGHT = 240;

/** Warn once the writer is this close to the cap. */
const WARN_REMAINING = 20;

const ACTION_ICONS = {
	photo: { Icon: Image, color: "#22c55e" },
	video: { Icon: Video, color: "#3b82f6" },
	gif: { Icon: Film, color: "#6366f1" },
} as const;

/** Maximum number of photos a single post accepts. */
const MAX_PHOTOS = 4;

/** Maximum number of videos a single post accepts. */
const MAX_VIDEOS = 1;

/** Image MIME types the composer accepts. */
const IMAGE_MIME_TYPES = "image/jpeg,image/png,image/webp";

/** Video MIME types the composer accepts. */
const VIDEO_MIME_TYPES = "video/mp4,video/webm,video/quicktime";

export function ComposerCard({ viewer }: { viewer: FeedViewer }) {
	const [value, setValue] = useState("");
	const [focused, setFocused] = useState(false);
	const [photos, setPhotos] = useState<
		Array<{ id: string; file: File; preview: string }>
	>([]);
	// Combined index into photos + videos for the lightbox.
	const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(
		null,
	);
	const [videos, setVideos] = useState<
		Array<{ id: string; file: File; preview: string }>
	>([]);
	const counterId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);

	const remaining = MAX_LENGTH - value.length;
	// The counter and the extra rows only appear once the writer engages, so the
	// resting card keeps its original one-line look. Staying active when attachments
	// are present lets the user remove them even after the field blurs.
	const active =
		focused || value.length > 0 || photos.length > 0 || videos.length > 0;

	/**
	 * Fit the field to its content. The DOM holds the truth here (the browser
	 * measures the wrapped text), so this runs from the events that change it
	 * rather than from an effect watching state. At rest the field keeps its
	 * natural `rows={1}` height, so nothing can go stale if CSS lands late.
	 */
	const resize = useCallback(
		(element: HTMLTextAreaElement | null, isActive: boolean) => {
			if (!element) {
				return;
			}

			if (!isActive) {
				element.style.removeProperty("height");
				element.style.removeProperty("overflow-y");
				return;
			}

			element.style.height = "auto";
			const needed = Math.max(element.scrollHeight, EXPANDED_HEIGHT);
			element.style.height = `${Math.min(needed, MAX_HEIGHT)}px`;
			element.style.overflowY = needed > MAX_HEIGHT ? "auto" : "hidden";
		},
		[],
	);

	const counterTone =
		remaining <= 0
			? "text-[var(--feed-danger)]"
			: remaining <= WARN_REMAINING
				? "text-[var(--feed-warn)]"
				: "text-[var(--feed-ink-dim)]";

	// Revoke object URLs that were removed since the last render, after React
	// has committed the DOM update so the lightbox doesn't try to load a revoked
	// URL during the transition frame.
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

			// Capture the files array immediately — the FileList is a live reference
			// to the input, which becomes empty once we reset the value below.
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

			// Reset input so the same file can be selected again after removal.
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[],
	);

	const removePhoto = useCallback((id: string) => {
		setPhotos((current) => current.filter((p) => p.id !== id));
		// Closing the lightbox when any media is removed avoids showing a
		// revoked object URL for a frame before the index shifts.
		setSelectedMediaIndex(null);
	}, []);

	const handleVideoSelect = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const files = event.target.files;
			if (!files || files.length === 0) return;

			// Capture the files array immediately — the FileList is a live reference
			// to the input, which becomes empty once we reset the value below.
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

			// Reset input so the same file can be selected again after removal.
			if (videoInputRef.current) {
				videoInputRef.current.value = "";
			}
		},
		[],
	);

	const removeVideo = useCallback((id: string) => {
		setVideos((current) => current.filter((v) => v.id !== id));
		// Closing the lightbox when any media is removed avoids showing a
		// revoked object URL for a frame before the index shifts.
		setSelectedMediaIndex(null);
	}, []);

	// Build a combined slides array: photos come first (index 0..photos.length-1),
	// then videos (index photos.length..photos.length+videos.length-1).
	// The key includes all preview URLs so the lightbox remounts with fresh slides
	// when any media is added or removed (revoking the old object URLs).
	const slidesKey = `${photos.length}-${videos.length}-${photos.map((p) => p.preview).join(",")}-${videos.map((v) => v.preview).join(",")}`;
	const slides: Array<SlideImage | SlideVideo> = [
		...photos.map((photo) => ({ type: "image", src: photo.preview })),
		...videos.map((v) => ({
			type: "video",
			sources: [{ src: v.preview, type: v.file.type }],
		})),
	];

	// Close the lightbox if the selected index is out of bounds — e.g., when all
	// remaining media are removed while the preview is open.
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
						<textarea
							aria-label="Recognize someone today"
							aria-describedby={active ? counterId : undefined}
							placeholder="Recognize someone today..."
							maxLength={MAX_LENGTH}
							rows={1}
							value={value}
							onChange={(event) => {
								setValue(event.target.value);
								resize(event.currentTarget, true);
							}}
							onFocus={(event) => {
								setFocused(true);
								resize(event.currentTarget, true);
							}}
							onBlur={(event) => {
								setFocused(false);
								// Keep the room the writer already used; only collapse an empty field.
								resize(event.currentTarget, event.currentTarget.value !== "");
							}}
							className="block w-full resize-none overflow-hidden bg-transparent pt-2 pb-1 text-[13px] leading-[1.35] text-[var(--feed-ink)] outline-none [overflow-wrap:anywhere] placeholder:text-[var(--feed-ink-dim)]"
						/>

						{active && (
							<>
								{(photos.length > 0 || videos.length > 0) && (
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
										const hasInput = value.trim().length > 0;
										const photosInUse = photos.length > 0;
										const videosInUse = videos.length > 0;
										const isPhotoFull =
											action.id === "photo" && photos.length >= MAX_PHOTOS;
										const isVideoFull =
											action.id === "video" && videos.length >= MAX_VIDEOS;
										// When one action is in use, disable the others.
										const isOtherActionInUse =
											(photosInUse && action.id !== "photo") ||
											(videosInUse && action.id !== "video");

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
														videos.length < MAX_VIDEOS)
														? () =>
																action.id === "photo"
																	? fileInputRef.current?.click()
																	: videoInputRef.current?.click()
														: undefined
												}
												disabled={
													!hasInput ||
													isPhotoFull ||
													isVideoFull ||
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
											disabled={
												(!value &&
													photos.length === 0 &&
													videos.length === 0) ||
												remaining <= 0
											}
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
				open={selectedMediaIndex !== null}
				close={() => setSelectedMediaIndex(null)}
				slides={slides}
				index={selectedMediaIndex ?? 0}
				plugins={[video]}
				controller={{
					disableSwipeNavigation: slides.length <= 1,
				}}
				render={
					slides.length <= 1
						? {
								buttonPrev: () => null,
								buttonNext: () => null,
							}
						: undefined
				}
			/>
		</Fragment>
	);
}
