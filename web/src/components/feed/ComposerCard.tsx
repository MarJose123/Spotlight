/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Film, Image, Video } from "lucide-react";
import { useCallback, useId, useState } from "react";
import type { FeedViewer } from "#/lib/feed-data.ts";
import { COMPOSER_ACTIONS } from "#/lib/feed-data.ts";
import { Avatar } from "./media";

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

export function ComposerCard({ viewer }: { viewer: FeedViewer }) {
	const [value, setValue] = useState("");
	const [focused, setFocused] = useState(false);
	const counterId = useId();

	const remaining = MAX_LENGTH - value.length;
	// The counter and the extra rows only appear once the writer engages, so the
	// resting card keeps its original one-line look.
	const active = focused || value.length > 0;

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

	return (
		<section className="rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-4">
			<div className="flex items-start gap-3">
				<Avatar name={viewer.name} tone={viewer.tone} size={38} />

				<div className="min-w-0 flex-1">
					<textarea
						aria-label="What's happening?"
						aria-describedby={active ? counterId : undefined}
						placeholder="What's happening?"
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

					<div className="mt-3 flex flex-wrap items-center gap-2">
						{COMPOSER_ACTIONS.map((action) => {
							const { Icon, color } = ACTION_ICONS[action.id];

							return (
								<button
									key={action.id}
									type="button"
									className="inline-flex items-center gap-1.5 rounded-full border border-[var(--feed-line)] bg-[var(--feed-inset)] px-3.5 py-2 text-[12px] font-semibold text-[var(--feed-ink-soft)] transition hover:text-[var(--feed-ink)]"
								>
									<Icon size={14} style={{ color }} aria-hidden="true" />
									{action.label}
								</button>
							);
						})}

						{active && (
							<span
								id={counterId}
								className={`ml-auto text-[11px] font-semibold tabular-nums ${counterTone}`}
							>
								{remaining <= 0 ? "Limit reached" : `${remaining} left`}
							</span>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
