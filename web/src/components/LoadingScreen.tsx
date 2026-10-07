/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Spotlight } from "lucide-react";

const LETTERS = "SPOTLIGHT".split("");

export default function LoadingScreen() {
	return (
		<output className="spotlight-loading" aria-label="Loading">
			<div className="spotlight-loading__stage">
				<div className="spotlight-loading__lamp spotlight-loading__lamp--left">
					<Spotlight className="spotlight-loading__icon" aria-hidden={true} />
					<div className="spotlight-loading__beam" />
				</div>
				<div className="spotlight-loading__lamp spotlight-loading__lamp--right">
					<Spotlight className="spotlight-loading__icon" aria-hidden={true} />
					<div className="spotlight-loading__beam" />
				</div>
				<h1 className="spotlight-loading__word">
					{LETTERS.map((letter, i) => (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: LETTERS is a static constant
							key={i}
							className="spotlight-loading__letter"
							style={{ "--index": String(i) } as React.CSSProperties}
						>
							{letter}
						</span>
					))}
				</h1>
			</div>
			<p className="spotlight-loading__sub">Loading</p>
		</output>
	);
}
