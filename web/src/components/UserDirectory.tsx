/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useSearch } from "@tanstack/react-router";
import {
	ArrowUp,
	MailPlus,
	RefreshCw,
	Search,
	Users,
	WifiOff,
	X,
} from "lucide-react";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
	useCurrentUser,
	useInviteUser,
	useUsersDirectory,
} from "#/lib/api-queries";
import type { AvatarTone, FeedViewer } from "#/lib/feed-data";
import { VIEWER } from "#/lib/feed-data";
import { readSession } from "#/lib/session";
import { AuthTopBar } from "./AuthTopBar";
import { UserCard } from "./UserCard";
import { UserDirectoryFilter } from "./UserDirectoryFilter";

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

/** React to session changes by listening for localStorage mutations and the
 * custom event the auth flow dispatches after sign-in or sign-out. */
function useSession() {
	const [session, setSession] = useState(() => readSession());

	useEffect(() => {
		const handler = () => setSession(readSession());
		window.addEventListener("storage", handler);
		window.addEventListener("spotlight:session-changed", handler);
		return () => {
			window.removeEventListener("storage", handler);
			window.removeEventListener("spotlight:session-changed", handler);
		};
	}, []);

	return session;
}

const PAGE_SIZE = 20;

export function UserDirectory() {
	const session = useSession();
	const sessionUser = session?.user;
	const searchParams = useSearch({ from: "/_authenticated/users" });

	const { data: currentUserData } = useCurrentUser();
	const isAdmin = currentUserData?.user.role === "ADMIN";

	const viewerId = sessionUser?.id;
	const viewer: FeedViewer = {
		...VIEWER,
		id: viewerId ?? VIEWER.id,
		name: sessionUser?.displayName ?? sessionUser?.name ?? VIEWER.name,
		handle: sessionUser?.username ? `@${sessionUser.username}` : VIEWER.handle,
		tone: toneForId(viewerId ?? VIEWER.id),
	};

	const [roleFilter, setRoleFilter] = useState<string | undefined>();
	const [searchQuery, setSearchQuery] = useState(searchParams.search ?? "");
	const [page, setPage] = useState(1);
	const [showScrollTop, setShowScrollTop] = useState(false);

	// Invite modal state
	const [inviteModalOpened, setInviteModalOpened] = useState(false);
	const inviteInputRef = useRef<HTMLInputElement>(null);
	const inviteMutation = useInviteUser();

	const inviteSchema = z.object({
		name: z
			.string()
			.min(1, "Name is required")
			.max(100, "Name must be 100 characters or less"),
		email: z.string().email("Please enter a valid email"),
	});

	const inviteForm = useForm({
		initialValues: { name: "", email: "" },
		validate: zod4Resolver(inviteSchema),
	});

	const { data, isLoading, isError } = useUsersDirectory({
		role: roleFilter,
		search: searchQuery || undefined,
		page,
		limit: PAGE_SIZE,
	});

	// Reset to page 1 when filter changes
	const handleRoleChange = (role: string | undefined) => {
		setRoleFilter(role);
		setPage(1);
	};

	// Reset to page 1 when search changes
	const handleSearchChange = (query: string) => {
		setSearchQuery(query);
		setPage(1);
	};

	// Track scroll position to show/hide the scroll-to-top button
	useEffect(() => {
		const onScroll = () => setShowScrollTop(window.scrollY > 200);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center">
				<div className="animate-pulse text-lg text-[var(--feed-ink-dim)]">
					Loading users…
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center">
				<section className="island-shell rise-in rounded-[2rem] px-8 py-10 text-center sm:px-10 sm:py-14">
					<p className="island-kicker mb-4">Connection error</p>
					<span className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--lagoon-deep)]">
						<WifiOff className="h-6 w-6" aria-hidden={true} />
					</span>
					<h1 className="display-title mx-auto mt-4 mb-0 text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
						Unable to load users
					</h1>
					<p className="mx-auto mt-4 mb-0 max-w-xs text-base leading-7 text-[var(--sea-ink-soft)]">
						Check your connection and try again.
					</p>
					<Button
						variant="subtle"
						leftSection={<RefreshCw size={16} aria-hidden={true} />}
						onClick={() => window.location.reload()}
						className="mt-8 rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
					>
						Try again
					</Button>
				</section>
			</div>
		);
	}

	const userList = data?.data ?? [];
	const meta = data?.meta;
	const totalPages = meta?.totalPages ?? 1;

	if (userList.length === 0) {
		return (
			<div className="flex flex-col">
				<AuthTopBar viewer={viewer} />
				<div className="flex min-h-[60vh] flex-col items-center justify-center">
					<section className="island-shell rise-in rounded-[2rem] px-8 py-10 text-center sm:px-10 sm:py-14">
						<span className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--lagoon-deep)]">
							<Users className="h-6 w-6" aria-hidden={true} />
						</span>
						<h1 className="display-title mx-auto mt-4 mb-0 text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
							No users found
						</h1>
						<p className="mx-auto mt-4 mb-0 max-w-xs text-base leading-7 text-[var(--sea-ink-soft)]">
							{searchQuery
								? "No employees match your search."
								: roleFilter
									? "No employees match the selected filter."
									: "There are no employee records yet."}
						</p>
					</section>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			<AuthTopBar viewer={viewer} />

			<div className="mx-auto max-w-5xl px-4 py-8">
				<div className="mb-8 flex flex-col gap-4">
					<div className="flex items-end justify-between">
						<div>
							<h1 className="m-0 text-2xl font-bold text-[var(--sea-ink)]">
								All Users
							</h1>
							<p className="mt-1 text-sm text-[var(--feed-ink-dim)]">
								{meta?.total ?? userList.length} employee
								{(meta?.total ?? userList.length) !== 1 ? "s" : ""} in the
								system
							</p>
						</div>
						<Group gap="sm">
							{isAdmin && (
								<Button
									variant="light"
									leftSection={<MailPlus size={16} aria-hidden={true} />}
									onClick={() => setInviteModalOpened(true)}
									className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
								>
									Invite User
								</Button>
							)}
							<UserDirectoryFilter
								value={roleFilter}
								onChange={handleRoleChange}
							/>
						</Group>
					</div>
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--feed-ink-dim)]"
							aria-hidden={true}
						/>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder="Search by name or email..."
							className="w-full rounded-full border border-[var(--feed-line)] bg-[var(--feed-card)] py-2 pl-9 pr-8 text-sm text-[var(--sea-ink)] placeholder-[var(--feed-ink-dim)] transition-colors focus:border-[var(--lagoon)] focus:outline-none"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => handleSearchChange("")}
								className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-[var(--feed-ink-dim)] transition-colors hover:text-[var(--sea-ink)]"
								aria-label="Clear search"
							>
								<X size={14} aria-hidden={true} />
							</button>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
					{userList.map((user) => (
						<UserCard
							key={user.id}
							id={user.id}
							name={user.displayName || user.name}
							email={user.email}
							role={user.role}
						/>
					))}
				</div>

				{showScrollTop && (
					<Button
						variant="subtle"
						onClick={scrollToTop}
						className="fixed bottom-6 left-1/2 z-20 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--feed-line)] bg-[var(--feed-card)] text-[var(--sea-ink)] shadow-md transition-opacity hover:border-[var(--lagoon)]"
						aria-label="Scroll to top"
					>
						<ArrowUp size={20} aria-hidden={true} />
					</Button>
				)}

				{totalPages > 1 && (
					<div className="mt-6 flex items-center justify-center gap-4 pb-8">
						<Button
							variant="subtle"
							disabled={!meta?.hasPreviousPage}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							className="rounded-full border border-[var(--feed-line)] bg-[var(--feed-card)] font-medium text-[var(--sea-ink)] hover:border-[var(--lagoon)] disabled:opacity-50"
						>
							Previous
						</Button>
						<span className="text-sm text-[var(--feed-ink-dim)]">
							Page {page} of {totalPages}
						</span>
						<Button
							variant="subtle"
							disabled={!meta?.hasNextPage}
							onClick={() => setPage((p) => p + 1)}
							className="rounded-full border border-[var(--feed-line)] bg-[var(--feed-card)] font-medium text-[var(--sea-ink)] hover:border-[var(--lagoon)] disabled:opacity-50"
						>
							Next
						</Button>
					</div>
				)}
			</div>

			<Modal
				opened={inviteModalOpened}
				onClose={() => {
					inviteForm.reset();
					setInviteModalOpened(false);
				}}
				onEnterTransitionEnd={() => {
					inviteInputRef.current?.focus();
				}}
				title={
					<div className="flex items-center gap-2">
						<MailPlus
							size={18}
							className="text-[var(--lagoon-deep)]"
							aria-hidden="true"
						/>
						<div>
							<p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
								Invite User
							</p>
							<p className="m-0 text-xs text-[var(--sea-ink-soft)]">
								Send an invitation by email
							</p>
						</div>
					</div>
				}
				centered
				size="md"
				withinPortal
			>
				<form
					onSubmit={inviteForm.onSubmit((values) => {
						inviteMutation.mutate(
							{ name: values.name, email: values.email },
							{
								onSuccess: () => {
									notifications.show({
										title: "User created",
										message: `${values.name} has been added to Spotlight.`,
										color: "teal",
									});
									inviteForm.reset();
									setInviteModalOpened(false);
								},
								onError: (error) => {
									const message =
										error instanceof Error
											? error.message
											: "Could not send invitation. Please try again.";
									notifications.show({
										title: "Invitation failed",
										message,
										color: "red",
									});
								},
							},
						);
					})}
				>
					<div className="flex flex-col gap-4">
						<TextInput
							ref={inviteInputRef}
							label="Name"
							placeholder="Jane Doe"
							withAsterisk
							{...inviteForm.getInputProps("name")}
						/>
						<TextInput
							label="Email address"
							placeholder="colleague@company.com"
							withAsterisk
							type="email"
							{...inviteForm.getInputProps("email")}
						/>
						<Button
							type="submit"
							loading={inviteMutation.isPending}
							disabled={inviteMutation.isPending}
							className="mt-2 w-full rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
						>
							Send Invitation
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
