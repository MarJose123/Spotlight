/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Button, Menu, Modal } from "@mantine/core";
import {
	MoreVertical,
	Shield,
	ShieldOff,
	Trash2,
	UserCheck,
	UserX,
} from "lucide-react";
import { useState } from "react";
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
	status?: string;
	isAdmin?: boolean;
	isSelf?: boolean;
	onToggleRole?: (userId: string, role: string) => void;
	onToggleStatus?: (userId: string) => void;
	onDelete?: (userId: string) => void;
}

export function UserCard({
	id,
	name,
	email,
	role,
	status,
	isAdmin,
	isSelf,
	onToggleRole,
	onToggleStatus,
	onDelete,
}: UserCardProps) {
	const tone = toneForId(id);
	const isActive = status === "Active";
	const isInactive = status === "Inactive";
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);

	return (
		<>
			<article className="group relative flex flex-col items-center gap-3 rounded-2xl border border-[var(--feed-line)] bg-[var(--feed-card)] p-6 transition-colors hover:border-[var(--lagoon)]">
				{isAdmin && !isSelf && (
					<Menu position="bottom-end" shadow="sm" width={180}>
						<Menu.Target>
							<button
								type="button"
								aria-label="User actions"
								className="absolute right-3 top-3 grid h-7 w-7 cursor-pointer place-items-center rounded-full text-[var(--feed-ink-dim)] opacity-0 transition-all hover:bg-[var(--feed-line)] hover:text-[var(--sea-ink)] group-hover:opacity-100"
							>
								<MoreVertical size={16} aria-hidden={true} />
							</button>
						</Menu.Target>

						<Menu.Dropdown>
							{isAdmin && onToggleRole && (
								<Menu.Item
									onClick={() =>
										onToggleRole(id, role === "ADMIN" ? "USER" : "ADMIN")
									}
									leftSection={
										role === "ADMIN" ? (
											<ShieldOff
												size={15}
												aria-hidden="true"
												className="text-[var(--feed-ink-dim)]"
											/>
										) : (
											<Shield
												size={15}
												aria-hidden="true"
												className="text-[var(--feed-ink-dim)]"
											/>
										)
									}
								>
									{role === "ADMIN" ? "Remove admin" : "Make admin"}
								</Menu.Item>
							)}
							{isAdmin && onToggleStatus && (
								<Menu.Item
									color={isActive ? "red" : undefined}
									onClick={() => onToggleStatus(id)}
									leftSection={
										isActive ? (
											<UserX
												size={15}
												aria-hidden="true"
												className="text-red-500"
											/>
										) : (
											<UserCheck
												size={15}
												aria-hidden="true"
												className="text-[var(--feed-ink-dim)]"
											/>
										)
									}
								>
									{isActive ? "Deactivate" : "Activate"}
								</Menu.Item>
							)}
							{isAdmin && onDelete && (
								<Menu.Item
									color="red"
									onClick={() =>
										isInactive
											? setShowDeleteConfirm(true)
											: setShowDeactivateWarning(true)
									}
									leftSection={
										<Trash2
											size={15}
											aria-hidden="true"
											className="text-red-500"
										/>
									}
								>
									Delete
								</Menu.Item>
							)}
						</Menu.Dropdown>
					</Menu>
				)}

				<Avatar name={name} tone={tone} size={56} />

				<div className="text-center">
					<h3 className="m-0 text-[15px] font-bold text-[var(--sea-ink)]">
						{name}
					</h3>
					<p className="m-0 text-[12px] text-[var(--feed-ink-dim)]">{email}</p>
				</div>

				<div className="flex gap-2">
					{role && (
						<span className="rounded-full bg-[var(--lagoon)]/15 px-3 py-1 text-[11px] font-medium text-[var(--lagoon-deep)]">
							{role}
						</span>
					)}
					{status && (
						<span
							className={`rounded-full px-3 py-1 text-[11px] font-medium ${
								isActive
									? "bg-[var(--lagoon)]/15 text-[var(--lagoon-deep)]"
									: "bg-[var(--feed-line)] text-[var(--feed-ink-dim)]"
							}`}
						>
							{status}
						</span>
					)}
				</div>
			</article>

			<Modal
				opened={showDeactivateWarning}
				onClose={() => setShowDeactivateWarning(false)}
				title="Cannot delete active user"
				size="sm"
				centered
			>
				<p className="m-0 text-sm text-[var(--feed-ink-dim)]">
					<strong>{name}</strong> is currently active. Please deactivate the
					user before deleting.
				</p>
				<div className="mt-4 flex justify-end">
					<Button
						variant="subtle"
						size="xs"
						onClick={() => setShowDeactivateWarning(false)}
					>
						OK
					</Button>
				</div>
			</Modal>

			<Modal
				opened={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				title="Delete user"
				size="sm"
				centered
			>
				<p className="m-0 text-sm text-[var(--feed-ink-dim)]">
					Are you sure you want to delete <strong>{name}</strong>? This action
					cannot be undone.
				</p>
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant="subtle"
						size="xs"
						onClick={() => setShowDeleteConfirm(false)}
					>
						Cancel
					</Button>
					<Button
						color="red"
						size="xs"
						onClick={() => {
							onDelete?.(id);
							setShowDeleteConfirm(false);
						}}
					>
						Delete
					</Button>
				</div>
			</Modal>
		</>
	);
}
