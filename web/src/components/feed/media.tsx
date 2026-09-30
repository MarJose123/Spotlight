/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { useId } from "react";
import type { AvatarTone, FeedPost } from "../../lib/feed-data";

/**
 * Portrait stand-ins for the feed. Real avatars come from `avatarUrl` once the
 * feed is wired to the API; until then a toned silhouette keeps the layout
 * honest without shipping stock photography.
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
	return (
		<span
			aria-hidden="true"
			className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-[var(--feed-avatar-ring)] ${
				brand ? "rounded-[0.65rem]" : "rounded-full"
			}`}
			style={{
				width: size,
				height: size,
				backgroundImage: toneGradient(tone),
			}}
		>
			{brand ? (
				<span
					className="font-black text-white/85"
					style={{ fontSize: Math.round(size * 0.46), lineHeight: 1 }}
				>
					{name.slice(0, 1)}
				</span>
			) : (
				<svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
					<circle cx="20" cy="15.5" r="6.4" fill="rgba(255,255,255,0.7)" />
					<path
						d="M6.4 41c0-7.5 6.1-13.6 13.6-13.6S33.6 33.5 33.6 41Z"
						fill="rgba(255,255,255,0.7)"
					/>
				</svg>
			)}
		</span>
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

export function PostMedia({
	media,
}: {
	media: NonNullable<FeedPost["media"]>;
}) {
	// Paint server ids must stay unique once several posts render together.
	const uid = useId().replace(/:/g, "");
	const room = `feed-room-${uid}`;
	const scrim = `feed-scrim-${uid}`;

	return (
		<div className="relative mt-3 overflow-hidden rounded-2xl border border-[var(--feed-line)]">
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
					<rect x="30" y="40" width="580" height="14" rx="4" fill="#f8fafc" />
					<rect x="30" y="150" width="580" height="14" rx="4" fill="#f8fafc" />
					<rect x="30" y="260" width="580" height="14" rx="4" fill="#f8fafc" />
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
		</div>
	);
}
