/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { useCallback, useId, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import type { AvatarTone, FeedMediaItem } from "../../lib/feed-data";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { useAttachmentUrl } from "./AuthenticatedMedia";

/**
 * Tone palettes used for both avatar backgrounds (ui-avatars.com) and reaction
 * badge gradients. Each entry is `[light, dark]` where `dark` is the single
 * hex value sent to ui-avatars.com.
 */
const TONES: Record<AvatarTone, [string, string]> = {
	lagoon: ["#5eead4", "#0f766e"],
	violet: ["#c4b5fd", "#5b21b6"],
	amber: ["#fcd34d", "#b45309"],
	rose: ["#fda4af", "#9f1239"],
	mint: ["#86efac", "#15803d"],
	slate: ["#94a3b8", "#334155"],
	sky: ["#7dd3fc", "#075985"],
};

export function toneGradient(tone: AvatarTone): string {
	const [from, to] = TONES[tone];

	return `linear-gradient(150deg, ${from}, ${to})`;
}

interface AvatarProps {
	name: string;
	tone: AvatarTone;
	size?: number;
	brand?: boolean;
}

export function Avatar({ name, tone, size = 36, brand = false }: AvatarProps) {
	const [, background] = TONES[tone];
	const bgColor = background.replace("#", "");
	const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=fff&size=${size * 2}&bold=${brand ? "true" : "false"}`;

	return (
		<img
			src={avatarUrl}
			alt={name}
			width={size}
			height={size}
			className={`shrink-0 border border-[var(--feed-avatar-ring)] ${
				brand ? "rounded-[0.65rem]" : "rounded-full"
			}`}
			style={{ width: size, height: size }}
		/>
	);
}

export function VerifiedBadge({ size = 14 }: { size?: number }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			role="img"
			aria-label="Verified"
			className="shrink-0"
		>
			<circle cx="12" cy="12" r="11" fill="var(--feed-accent)" />
			<path
				d="m7.6 12.4 2.9 2.9 5.9-6.1"
				fill="none"
				stroke="#ffffff"
				strokeWidth="2.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function CoverArt() {
	return (
		<svg
			viewBox="0 0 320 96"
			preserveAspectRatio="xMidYMid slice"
			className="h-full w-full"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="feed-cover" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#9ad9a4" />
					<stop offset="0.45" stopColor="#3f8f5f" />
					<stop offset="1" stopColor="#17543a" />
				</linearGradient>
				<radialGradient id="feed-cover-glow" cx="0.24" cy="0.15" r="0.62">
					<stop offset="0" stopColor="#e7f7e1" stopOpacity="0.62" />
					<stop offset="1" stopColor="#e7f7e1" stopOpacity="0" />
				</radialGradient>
				<radialGradient id="feed-cover-depth" cx="0.82" cy="0.95" r="0.8">
					<stop offset="0" stopColor="#07271a" stopOpacity="0.7" />
					<stop offset="1" stopColor="#07271a" stopOpacity="0" />
				</radialGradient>
			</defs>

			<rect width="320" height="96" fill="url(#feed-cover)" />
			<path
				d="M-10 74C40 44 84 88 140 60s96 12 190-26v70H-10Z"
				fill="#ffffff"
				opacity="0.1"
			/>
			<ellipse cx="62" cy="30" rx="52" ry="30" fill="#ffffff" opacity="0.1" />
			<rect width="320" height="96" fill="url(#feed-cover-glow)" />
			<rect width="320" height="96" fill="url(#feed-cover-depth)" />

			<g fill="#ffffff" opacity="0.55">
				<ellipse cx="58" cy="26" rx="7" ry="5" />
				<ellipse cx="92" cy="46" rx="5" ry="3.6" />
				<ellipse cx="38" cy="58" rx="4" ry="2.8" />
				<ellipse cx="140" cy="22" rx="3.4" ry="2.4" />
				<ellipse cx="196" cy="62" rx="4.4" ry="3" />
			</g>
		</svg>
	);
}

const BOXES: Array<{
	x: number;
	y: number;
	w: number;
	h: number;
	fill: string;
}> = [
	{ x: 54, y: 92, w: 74, h: 46, fill: "#f97316" },
	{ x: 138, y: 96, w: 62, h: 42, fill: "#f8fafc" },
	{ x: 210, y: 88, w: 80, h: 50, fill: "#ef4444" },
	{ x: 300, y: 98, w: 58, h: 40, fill: "#f8fafc" },
	{ x: 368, y: 90, w: 72, h: 48, fill: "#e2e8f0" },
	{ x: 450, y: 96, w: 64, h: 42, fill: "#2dd4bf" },
	{ x: 524, y: 92, w: 62, h: 46, fill: "#fb7185" },
	{ x: 120, y: 186, w: 86, h: 54, fill: "#f1f5f9" },
	{ x: 216, y: 190, w: 70, h: 50, fill: "#facc15" },
	{ x: 296, y: 182, w: 96, h: 58, fill: "#f8fafc" },
	{ x: 402, y: 188, w: 78, h: 52, fill: "#f97316" },
	{ x: 490, y: 184, w: 84, h: 56, fill: "#e2e8f0" },
];

/**
 * Thumbnail preview for a photo attached to the composer. Each tile carries a
 * remove button so the writer can drop an attachment before posting. Clicking
 * the image opens a full-size preview dialog.
 */
export function ComposerPhotoPreview({
	src,
	onRemove,
	onView,
}: {
	src: string;
	onRemove: () => void;
	onView: () => void;
}) {
	return (
		<div className="relative shrink-0">
			<button
				type="button"
				onClick={onView}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onView();
					}
				}}
				aria-label="View full size"
				className="-ml-1 p-1"
			>
				<img
					src={src}
					alt="Selected attachment"
					className="h-20 w-20 rounded-xl border border-[var(--feed-line)] object-cover"
				/>
			</button>
			<button
				type="button"
				onClick={onRemove}
				aria-label="Remove photo"
				className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--feed-card)] text-[var(--feed-ink-soft)] shadow ring-2 ring-[var(--feed-card)] transition hover:text-[var(--feed-ink)]"
			>
				<svg
					width="10"
					height="10"
					viewBox="0 0 10 10"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					fill="none"
					aria-hidden="true"
				>
					<path d="M2 2l6 6M8 2l-6 6" />
				</svg>
			</button>
		</div>
	);
}

/**
 * Thumbnail preview for a video attached to the composer. Each tile carries a
 * remove button so the writer can drop an attachment before posting. Clicking
 * the video opens a full-size player.
 */
export function ComposerVideoPreview({
	src,
	onRemove,
	onView,
}: {
	src: string;
	onRemove: () => void;
	onView: () => void;
}) {
	return (
		<div className="relative shrink-0">
			<button
				type="button"
				onClick={onView}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onView();
					}
				}}
				aria-label="View video"
				className="-ml-1 p-1"
			>
				<video
					src={src}
					muted
					className="h-20 w-20 rounded-xl border border-[var(--feed-line)] object-cover"
				/>
			</button>
			<button
				type="button"
				onClick={onRemove}
				aria-label="Remove video"
				className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--feed-card)] text-[var(--feed-ink-soft)] shadow ring-2 ring-[var(--feed-card)] transition hover:text-[var(--feed-ink)]"
			>
				<svg
					width="10"
					height="10"
					viewBox="0 0 10 10"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					fill="none"
					aria-hidden="true"
				>
					<path d="M2 2l6 6M8 2l-6 6" />
				</svg>
			</button>
		</div>
	);
}

export function PostMedia({ media }: { media: FeedMediaItem }) {
	// Paint server ids must stay unique once several posts render together.
	const uid = useId().replace(/:/g, "");
	const room = `feed-room-${uid}`;
	const scrim = `feed-scrim-${uid}`;

	const hasUrl = media.url && media.url.length > 0;
	const resolvedUrl = useAttachmentUrl(media.url ?? "");

	return (
		<div className="relative overflow-hidden rounded-2xl border border-[var(--feed-line)]">
			{hasUrl && resolvedUrl && media.type === "image" && (
				<img
					src={resolvedUrl}
					alt={media.alt}
					className="block w-full object-cover"
				/>
			)}
			{hasUrl && resolvedUrl && media.type === "video" && (
				/* biome-ignore lint/a11y/useMediaCaption: user-uploaded videos have no caption track */
				<video
					src={resolvedUrl}
					controls
					aria-label={media.alt}
					className="block w-full"
				/>
			)}
			{hasUrl && resolvedUrl && media.type === "gif" && (
				<img
					src={resolvedUrl}
					alt={media.alt}
					className="block w-full object-cover"
				/>
			)}
			{!hasUrl && (
				<>
					<svg
						viewBox="0 0 640 360"
						preserveAspectRatio="xMidYMid slice"
						className="block h-full w-full"
						role="img"
						aria-label={media.alt}
					>
						<defs>
							<linearGradient id={room} x1="0" y1="0" x2="0" y2="1">
								<stop offset="0" stopColor="#9aa0a6" />
								<stop offset="0.55" stopColor="#727981" />
								<stop offset="1" stopColor="#4b5259" />
							</linearGradient>
							<linearGradient id={scrim} x1="0" y1="0" x2="0" y2="1">
								<stop offset="0.45" stopColor="#05070a" stopOpacity="0" />
								<stop offset="1" stopColor="#05070a" stopOpacity="0.72" />
							</linearGradient>
						</defs>

						<rect width="640" height="360" fill={`url(#${room})`} />

						<g>
							<rect
								x="30"
								y="40"
								width="580"
								height="14"
								rx="4"
								fill="#f8fafc"
							/>
							<rect
								x="30"
								y="150"
								width="580"
								height="14"
								rx="4"
								fill="#f8fafc"
							/>
							<rect
								x="30"
								y="260"
								width="580"
								height="14"
								rx="4"
								fill="#f8fafc"
							/>
						</g>

						<g>
							{BOXES.map((box) => (
								<rect
									key={`${box.x}-${box.y}`}
									x={box.x}
									y={box.y}
									width={box.w}
									height={box.h}
									rx="6"
									fill={box.fill}
									opacity="0.96"
								/>
							))}
						</g>

						<ellipse
							cx="320"
							cy="352"
							rx="260"
							ry="40"
							fill="#0d1117"
							opacity="0.35"
						/>
						<rect width="640" height="360" fill={`url(#${scrim})`} />
					</svg>

					<div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
						<p className="m-0 text-[13px] font-semibold text-white">
							{media.title}
						</p>
						<p className="m-0 text-[11.5px] text-white/70">{media.subtitle}</p>
					</div>
				</>
			)}
		</div>
	);
}

/**
 * Facebook-style grid gallery for images, with full-width rendering for videos
 * and GIFs. Layout adapts to image count: 1 item fills the grid, 2 items sit
 * side by side, 3 items show one large with two smaller ones, and 4+ items use
 * one large half with the rest in a grid. Clicking an image opens a full-screen
 * lightbox. Videos and GIFs stack vertically at full width below the grid.
 */
export function MediaGrid({ items }: { items: FeedMediaItem[] }) {
	const [openIndex, setOpenIndex] = useState(-1);
	const onClose = useCallback(() => setOpenIndex(-1), []);

	if (items.length === 0) return null;

	const images = items.filter((item) => item.type === "image");
	const nonImages = items.filter((item) => item.type !== "image");
	const slides = images.map((item) => ({
		src: item.url,
		alt: item.alt,
		width: 1200,
		height: 800,
	}));

	const renderMedia = (item: FeedMediaItem, index: number) => (
		<button
			key={`${item.url}-${item.type}-${index}`}
			type="button"
			className="cursor-pointer outline-none transition-opacity hover:opacity-90"
			onClick={() => {
				const imgIndex = images.findIndex((img) => img.url === item.url);
				setOpenIndex(imgIndex);
			}}
			aria-label={`View image ${index + 1} of ${images.length}`}
		>
			<PostMedia media={item} />
		</button>
	);

	// Render videos and GIFs at full width
	const renderNonImages = () => {
		if (nonImages.length === 0) return null;
		return (
			<div className="mt-3 flex flex-col gap-3">
				{nonImages.map((item) => (
					<div
						key={`${item.url}-${item.type}`}
						className="overflow-hidden rounded-xl border border-[var(--feed-line)]"
					>
						<PostMedia media={item} />
					</div>
				))}
			</div>
		);
	};

	// Only images: render Facebook-style grid
	if (images.length === 0) {
		return <>{renderNonImages()}</>;
	}

	// 1 image: single full-width
	if (images.length === 1) {
		return (
			<>
				<div className="mt-3 overflow-hidden rounded-2xl">
					{renderMedia(images[0], 0)}
				</div>
				{renderNonImages()}
				<Lightbox
					open={openIndex >= 0}
					slides={slides}
					index={openIndex}
					close={onClose}
					onClose={onClose}
					plugins={[Thumbnails, Fullscreen, Zoom]}
				/>
			</>
		);
	}

	// 2 images: side by side
	if (images.length === 2) {
		return (
			<>
				<div className="mt-3 gap-[2px] grid grid-cols-2 overflow-hidden rounded-2xl">
					{images.map((item, i) => renderMedia(item, i))}
				</div>
				{renderNonImages()}
				<Lightbox
					open={openIndex >= 0}
					slides={slides}
					index={openIndex}
					close={onClose}
					onClose={onClose}
					plugins={[Thumbnails, Fullscreen, Zoom]}
				/>
			</>
		);
	}

	// 3 images: one large (full width row), two small below
	if (images.length === 3) {
		return (
			<>
				<div className="mt-3 gap-[2px] grid grid-cols-2 rounded-2xl overflow-hidden">
					<div className="col-span-2">{renderMedia(images[0], 0)}</div>
					{images.slice(1).map((item, i) => renderMedia(item, i + 1))}
				</div>
				{renderNonImages()}
				<Lightbox
					open={openIndex >= 0}
					slides={slides}
					index={openIndex}
					close={onClose}
					onClose={onClose}
					plugins={[Thumbnails, Fullscreen, Zoom]}
				/>
			</>
		);
	}

	// 4+ images: one large taking half (rowspan 2), rest in grid
	return (
		<>
			<div className="mt-3 gap-[2px] grid grid-cols-3 rounded-2xl overflow-hidden">
				<div className="row-span-2">{renderMedia(images[0], 0)}</div>
				{images.slice(1).map((item, i) => renderMedia(item, i + 1))}
			</div>
			{renderNonImages()}
			<Lightbox
				open={openIndex >= 0}
				slides={slides}
				index={openIndex}
				close={onClose}
				onClose={onClose}
				plugins={[Thumbnails, Fullscreen, Zoom]}
			/>
		</>
	);
}
