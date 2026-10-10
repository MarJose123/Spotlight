/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { AvatarTone } from "#/lib/feed-data";
import { Avatar } from "./feed/media";

/** Derive a stable avatar tone from a user id. */
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

interface UserCardProps {
	id: string;
	name: string;
	email: string;
	role?: string;
}

export function UserCard({ id, name, email, role }: UserCardProps) {
	const tone = toneForId(id);

	return (
		<article className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-6 transition-colors hover:border-[var(--lagoon)]">
			<Avatar name={name} tone={tone} size={56} />

			<div className="text-center">
				<h3 className="m-0 text-[15px] font-bold text-[var(--sea-ink)]">
					{name}
				</h3>
				<p className="m-0 text-[12px] text-[var(--feed-ink-dim)]">{email}</p>
			</div>

			{role && (
				<span className="mt-1 rounded-full bg-[var(--lagoon)]/15 px-3 py-1 text-[11px] font-medium text-[var(--lagoon-deep)]">
					{role}
				</span>
			)}
		</article>
	);
}
