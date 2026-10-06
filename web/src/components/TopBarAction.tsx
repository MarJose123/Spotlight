/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { ReactNode } from "react";

export interface TopBarActionProps {
	label: string;
	badge?: string;
	onClick?: () => void;
	children: ReactNode;
}

/**
 * Round icon button used across the feed top bar. Anything that needs to sit in
 * that row — including the theme toggle — rides this same shell so the icons,
 * hit area, and hover treatment stay aligned.
 */
export function TopBarAction({
	label,
	badge,
	onClick,
	children,
}: TopBarActionProps) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={onClick}
			className="relative grid h-8 w-8 place-items-center rounded-full text-[var(--feed-ink-soft)] transition hover:bg-[var(--feed-hover)] hover:text-[var(--feed-ink)]"
		>
			{children}
			{badge && (
				<span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--feed-accent)] px-1 text-[9px] font-bold text-white">
					{badge}
				</span>
			)}
		</button>
	);
}
