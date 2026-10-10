/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Menu } from "@mantine/core";
import { Filter } from "lucide-react";

export interface UserDirectoryFilterProps {
	value?: string;
	onChange: (role: string | undefined) => void;
}

const ROLES = [
	{ label: "All", value: undefined },
	{ label: "User", value: "USER" },
	{ label: "Admin", value: "ADMIN" },
];

export function UserDirectoryFilter({
	value,
	onChange,
}: UserDirectoryFilterProps) {
	const currentLabel = ROLES.find((r) => r.value === value)?.label ?? "All";

	return (
		<Menu position="bottom-end" withinPortal>
			<Menu.Target>
				<button
					type="button"
					className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
						value
							? "border-[var(--lagoon)] bg-[rgba(79,184,178,0.14)] text-[var(--lagoon-deep)]"
							: "border-[var(--feed-line)] text-[var(--feed-ink-dim)] hover:border-[var(--lagoon)]"
					}`}
				>
					<Filter className="h-4 w-4" aria-hidden={true} />
					{currentLabel}
				</button>
			</Menu.Target>

			<Menu.Dropdown>
				{ROLES.map((role) => (
					<Menu.Item
						key={String(role.value)}
						onClick={() => onChange(role.value)}
					>
						<span className={role.value === value ? "font-semibold" : ""}>
							{role.label}
						</span>
					</Menu.Item>
				))}

				{value && (
					<>
						<Menu.Divider />
						<Menu.Item onClick={() => onChange(undefined)}>
							Clear filter
						</Menu.Item>
					</>
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
