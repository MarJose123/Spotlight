/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import type { ComponentType, ReactNode, SVGProps } from "react";

export const statusPrimaryActionClass =
	"inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-6 py-3 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]";

export const statusSecondaryActionClass =
	"inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-6 py-3 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:-translate-y-0.5 hover:text-[var(--sea-ink)]";

type StatusPageProps = {
	code: number;
	kicker: string;
	title: string;
	description: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	details?: ReactNode;
	actions?: ReactNode;
};

export default function StatusPage({
	code,
	kicker,
	title,
	description,
	icon: Icon,
	details,
	actions,
}: StatusPageProps) {
	return (
		<main className="page-wrap px-4 py-16">
			<section className="island-shell rise-in mx-auto w-full max-w-2xl rounded-[2rem] px-6 py-12 text-center sm:px-10 sm:py-16">
				<p className="island-kicker mb-4">{kicker}</p>
				<span className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--lagoon-deep)]">
					<Icon className="h-6 w-6" aria-hidden={true} />
				</span>
				<p
					aria-hidden={true}
					className="display-title m-0 text-6xl font-bold leading-none tracking-tight text-[var(--sea-ink)] sm:text-7xl"
				>
					{code}
				</p>
				<h1 className="display-title mx-auto mt-4 mb-0 text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
					{title}
				</h1>
				<p className="mx-auto mt-4 mb-0 max-w-md text-base leading-7 text-[var(--sea-ink-soft)]">
					<span className="sr-only">{code} </span>
					{description}
				</p>
				{details}
				{actions ? (
					<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
						{actions}
					</div>
				) : null}
			</section>
		</main>
	);
}
