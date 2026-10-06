/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Menu } from "@mantine/core";
import { LogOut, Settings } from "lucide-react";
import { performLogout } from "../../lib/auth";
import type { FeedViewer } from "../../lib/feed-data";
import { Avatar } from "./media";

export function UserMenu({ viewer }: { viewer: FeedViewer }) {
	return (
		<Menu position="bottom-end" shadow="md" width={180}>
			<Menu.Target>
				<button type="button" className="flex items-center">
					<Avatar name={viewer.name} tone={viewer.tone} size={36} />
				</button>
			</Menu.Target>

			<Menu.Dropdown>
				<div className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[var(--feed-ink)]">
					{viewer.name}
				</div>
				<Menu.Divider />
				<Menu.Item
					component="a"
					href="/#"
					leftSection={
						<Settings
							size={15}
							className="text-[var(--feed-ink-dim)]"
							aria-hidden="true"
						/>
					}
				>
					Settings
				</Menu.Item>
				<Menu.Item
					color="red"
					leftSection={<LogOut size={15} aria-hidden="true" />}
					onClick={() => void performLogout()}
				>
					Log out
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
