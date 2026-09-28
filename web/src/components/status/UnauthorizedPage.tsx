/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Link } from "@tanstack/react-router";
import { Home, LogIn, ShieldAlert } from "lucide-react";
import StatusPage, {
	statusPrimaryActionClass,
	statusSecondaryActionClass,
} from "./StatusPage";

type UnauthorizedPageProps = {
	redirectTo?: string;
};

export default function UnauthorizedPage({
	redirectTo,
}: UnauthorizedPageProps) {
	return (
		<StatusPage
			code={401}
			kicker="Unauthorized"
			icon={ShieldAlert}
			title="Sign in to continue."
			description="This page is limited to signed-in teammates. Authenticate with your organization account, then open the page again."
			details={
				redirectTo ? (
					<p className="mx-auto mt-5 mb-0 text-sm text-[var(--sea-ink-soft)]">
						You were heading to <code>{redirectTo}</code>
					</p>
				) : null
			}
			actions={
				<>
					<Link
						to="/signin"
						search={{ redirect: redirectTo }}
						className={statusPrimaryActionClass}
					>
						<LogIn className="h-4 w-4" aria-hidden={true} />
						Sign in
					</Link>
					<Link to="/" className={statusSecondaryActionClass}>
						<Home className="h-4 w-4" aria-hidden={true} />
						Back to Spotlight
					</Link>
				</>
			}
		/>
	);
}
