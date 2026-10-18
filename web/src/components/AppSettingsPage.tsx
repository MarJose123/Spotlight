/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
	Alert,
	Box,
	Button,
	Group,
	Input,
	Loader,
	Menu,
	NumberInput,
	Pagination,
	Paper,
	Stack,
	Tabs,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Check, Clock, Filter, InfoIcon, Search, Star, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	useAppSettings,
	useUpdateAppSetting,
	useUpdateUserBudget,
	useUsersWithBudgets,
} from "#/lib/api-queries";
import type { AvatarTone, FeedViewer } from "#/lib/feed-data";
import { VIEWER } from "#/lib/feed-data";
import { readSession } from "#/lib/session";
import { AuthTopBar } from "./AuthTopBar";
import { Avatar } from "./feed/media";

const SETTINGS_GROUPS = [
	{
		key: "points-system",
		label: "Points System",
		icon: Star,
	},
	{
		key: "post-settings",
		label: "Post Settings",
		icon: Clock,
	},
];

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

/** Settings page accessible only to admin users. */
export function AppSettingsPage() {
	const session = readSession();
	const sessionUser = session?.user;
	const viewerId = sessionUser?.id;
	const viewer: FeedViewer = {
		...VIEWER,
		id: viewerId ?? VIEWER.id,
		name: sessionUser?.displayName ?? sessionUser?.name ?? VIEWER.name,
		handle: sessionUser?.username ? `@${sessionUser.username}` : VIEWER.handle,
		tone: toneForId(viewerId ?? VIEWER.id),
	};

	const [activeTab, setActiveTab] = useState("points-system");
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<string | undefined>();
	const limit = 10;
	const { data: settings, isLoading: settingsLoading } = useAppSettings();
	const { data: usersWithBudgets, isLoading: budgetsLoading } =
		useUsersWithBudgets({
			page,
			limit,
			search: searchQuery || undefined,
			role: roleFilter,
		});
	const updateSetting = useUpdateAppSetting();
	const updateUserBudget = useUpdateUserBudget();

	// Points System state
	const [defaultBudget, setDefaultBudget] = useState(
		settings?.find((s) => s.key === "leaderboard.monthlyPoints")?.value ??
			"100",
	);
	const [budgetOverrides, setBudgetOverrides] = useState<
		Record<string, number>
	>({});

	// Post Settings state
	const [postSettings, setPostSettings] = useState<Record<string, string>>({});
	const [postSettingsChanged, setPostSettingsChanged] = useState(false);

	const getSettingValue = useCallback(
		(key: string) => settings?.find((s) => s.key === key)?.value ?? "",
		[settings],
	);

	// Initialize post settings from API data
	const initialized = useMemo(
		() => Object.keys(postSettings).length > 0,
		[postSettings],
	);
	useEffect(() => {
		if (settings && !initialized) {
			const initial: Record<string, string> = {};
			[
				"posts.editWindowMinutes",
				"posts.deleteWindowMinutes",
				"comments.editWindowMinutes",
				"comments.deleteWindowMinutes",
			].forEach((key) => {
				initial[key] = getSettingValue(key);
			});
			setPostSettings(initial);
		}
	}, [settings, initialized, getSettingValue]);

	const resolvedPostSettings = postSettings;

	// Sync defaultBudget when settings load
	const defaultBudgetSynced = useRef(false);
	useEffect(() => {
		if (settings && !defaultBudgetSynced.current) {
			const val = settings.find(
				(s) => s.key === "leaderboard.monthlyPoints",
			)?.value;
			if (val) {
				setDefaultBudget(val);
				defaultBudgetSynced.current = true;
			}
		}
	}, [settings]);

	// Reset to page 1 when filter or search changes
	const handleRoleChange = (role: string | undefined) => {
		setRoleFilter(role);
		setPage(1);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setPage(1);
	};

	const ROLES = [
		{ label: "All", value: undefined },
		{ label: "User", value: "USER" },
		{ label: "Admin", value: "ADMIN" },
	];

	const currentRoleLabel =
		ROLES.find((r) => r.value === roleFilter)?.label ?? "All";

	// Auto-save per-user budget overrides with debounce
	const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});
	const savingBudgetsRef = useRef<Set<string>>(new Set());
	const [savingBudgets, setSavingBudgets] = useState<Set<string>>(new Set());

	const handleBudgetOverrideChange = useCallback(
		(userId: string, val: number) => {
			setBudgetOverrides((prev) => ({ ...prev, [userId]: val }));

			// Clear previous debounce for this user
			if (debounceRef.current[userId]) {
				clearTimeout(debounceRef.current[userId]);
			}

			// Debounce save per user
			debounceRef.current[userId] = setTimeout(() => {
				const entry = usersWithBudgets?.data?.find((e) => e.user.id === userId);
				if (!entry) return;

				const oldValue = entry.customBudget ?? entry.resolvedBudget;
				const customBudget =
					val === entry.resolvedBudget && !entry.customBudget ? null : val;
				if (customBudget !== entry.customBudget) {
					// Mark as saving
					setSavingBudgets((prev) => new Set(prev).add(userId));
					savingBudgetsRef.current.add(userId);

					updateUserBudget.mutate(
						{ userId, customBudget },
						{
							onSuccess: () => {
								const newValue = customBudget ?? entry.resolvedBudget;
								notifications.show({
									title: "Points updated",
									message: `${entry.user.name}: ${oldValue} pts → ${newValue} pts`,
									color: "teal",
								});
							},
							onSettled: () => {
								setSavingBudgets((prev) => {
									const next = new Set(prev);
									next.delete(userId);
									return next;
								});
								savingBudgetsRef.current.delete(userId);
							},
						},
					);
				}
			}, 800);
		},
		[usersWithBudgets, updateUserBudget],
	);

	// Check if default budget has changed
	const defaultBudgetChanged = useMemo(
		() =>
			defaultBudget !==
			(settings?.find((s) => s.key === "leaderboard.monthlyPoints")?.value ??
				"100"),
		[defaultBudget, settings],
	);

	const handleSaveDefaultBudget = useCallback(() => {
		updateSetting.mutate(
			{
				key: "leaderboard.monthlyPoints",
				value: String(Number(defaultBudget)),
			},
			{
				onSuccess: () => {
					notifications.show({
						title: "Saved",
						message: "Default monthly budget updated.",
						color: "teal",
					});
				},
			},
		);
	}, [defaultBudget, updateSetting]);

	const handleSavePostSettings = useCallback(() => {
		const mutations: Promise<unknown>[] = [];
		[
			"posts.editWindowMinutes",
			"posts.deleteWindowMinutes",
			"comments.editWindowMinutes",
			"comments.deleteWindowMinutes",
		].forEach((key) => {
			const current = getSettingValue(key);
			const updated = resolvedPostSettings[key];
			if (updated && updated !== current) {
				mutations.push(
					updateSetting.mutateAsync({ key, value: String(Number(updated)) }),
				);
			}
		});

		if (mutations.length > 0) {
			Promise.all(mutations).then(() => {
				notifications.show({
					title: "Saved",
					message: "Post settings updated.",
					color: "teal",
				});
				setPostSettingsChanged(false);
			});
		}
	}, [resolvedPostSettings, getSettingValue, updateSetting]);

	const onPostSettingChange = useCallback(
		(key: string, value: string | number | null) => {
			if (value !== null && value !== "") {
				setPostSettings((prev) => {
					const next = { ...prev, [key]: String(Number(value)) };
					setPostSettingsChanged(
						Object.entries(next).some(([k, v]) => v !== getSettingValue(k)),
					);
					return next;
				});
			}
		},
		[getSettingValue],
	);

	if (settingsLoading || budgetsLoading) {
		return (
			<div className="flex min-h-screen flex-col">
				<AuthTopBar viewer={viewer} />
				<Box className="flex h-64 items-center justify-center">
					<Loader size="md" />
				</Box>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			<AuthTopBar viewer={viewer} />
			<Paper className="mx-auto w-full max-w-5xl p-4 md:p-6 lg:p-8">
				<Stack gap="lg">
					<div>
						<Title order={2} className="text-(--sea-ink)">
							Application Settings
						</Title>
						<Text size="sm" className="mt-1 text-(--sea-ink-soft)">
							Manage points, budgets, and content moderation settings.
						</Text>
					</div>

					<Tabs value={activeTab} onChange={(val) => val && setActiveTab(val)}>
						<Tabs.List className="gap-1 rounded-xl bg-(--surface) p-1.5">
							{SETTINGS_GROUPS.map((group) => {
								const GroupIcon = group.icon;
								return (
									<Tabs.Tab
										key={group.key}
										value={group.key}
										leftSection={<GroupIcon size={14} aria-hidden="true" />}
										className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
									>
										{group.label}
									</Tabs.Tab>
								);
							})}
						</Tabs.List>

						<Tabs.Panel value="points-system" className="pt-4">
							<Stack gap="lg">
								<div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
									<Stack gap="md">
										<div className="flex items-center gap-2.5">
											<span className="grid h-6 w-6 place-items-center rounded-lg bg-(--lagoon)/15 text-(--lagoon)">
												<Star size={14} aria-hidden="true" />
											</span>
											<Text
												size="sm"
												className="font-semibold text-(--sea-ink)"
											>
												Default Monthly Budget
											</Text>
											<Tooltip
												label="Points each user can share per month when mentioning colleagues in posts."
												position="top"
												withinPortal
											>
												<span className="cursor-help text-(--sea-ink-soft) hover:text-(--sea-ink)">
													<InfoIcon size={14} aria-hidden="true" />
												</span>
											</Tooltip>
										</div>
										<div className="flex items-end gap-3">
											<NumberInput
												value={defaultBudget}
												onChange={(val) => {
													if (val !== null) {
														setDefaultBudget(String(Math.max(0, Number(val))));
													}
												}}
												min={0}
												rightSection="pts"
												rightSectionWidth={40}
											/>
											<Button
												leftSection={<Check size={14} aria-hidden="true" />}
												disabled={
													!defaultBudgetChanged || updateSetting.isPending
												}
												onClick={handleSaveDefaultBudget}
												className="bg-(--lagoon) text-white hover:bg-(--lagoon-deep) disabled:opacity-40"
											>
												Save
											</Button>
										</div>
									</Stack>
								</div>

								<Alert
									icon={<InfoIcon size={16} aria-hidden="true" />}
									title="How monthly budgets work"
									color="blue"
									className="rounded-xl bg-(--foam) text-(--sea-ink) border border-(--line)"
								>
									Each user receives a monthly budget of points to distribute as
									rewards when they mention colleagues in posts. Changing a
									user&apos;s budget here only affects the next month — the
									current month&apos;s budget stays unchanged.
								</Alert>

								<Group align="center" gap="sm" className="flex-wrap">
									<Input
										placeholder="Search by name or email…"
										value={searchQuery}
										onChange={(e) => handleSearchChange(e.currentTarget.value)}
										leftSection={
											<Search size={16} className="text-(--sea-ink-soft)" />
										}
										rightSection={
											searchQuery ? (
												<button
													type="button"
													onClick={() => handleSearchChange("")}
													className="cursor-pointer rounded-full p-1 text-(--sea-ink-soft) hover:bg-(--line) hover:text-(--sea-ink)"
												>
													<X size={14} />
												</button>
											) : undefined
										}
										className="max-w-64"
									/>
									<Menu position="bottom-end" withinPortal>
										<Menu.Target>
											<Button
												variant="default"
												leftSection={<Filter size={14} aria-hidden={true} />}
												className="rounded-full border border-(--line) text-sm font-medium hover:border-(--lagoon) hover:bg-(--lagoon)/10"
											>
												{currentRoleLabel}
											</Button>
										</Menu.Target>
										<Menu.Dropdown>
											{ROLES.map((role) => (
												<Menu.Item
													key={String(role.value)}
													onClick={() => handleRoleChange(role.value)}
												>
													<span
														className={
															role.value === roleFilter ? "font-semibold" : ""
														}
													>
														{role.label}
													</span>
												</Menu.Item>
											))}
											{roleFilter && (
												<>
													<Menu.Divider />
													<Menu.Item
														onClick={() => handleRoleChange(undefined)}
													>
														Clear filter
													</Menu.Item>
												</>
											)}
										</Menu.Dropdown>
									</Menu>
								</Group>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{usersWithBudgets?.data?.map((entry) => {
										const currentValue =
											budgetOverrides[entry.user.id] ??
											entry.customBudget ??
											entry.resolvedBudget;
										const tone = toneForId(entry.user.id);
										return (
											<div
												key={entry.user.id}
												className="group flex flex-col items-center gap-3 rounded-2xl border border-(--line) bg-(--surface) p-6 transition-all hover:border-(--lagoon) hover:shadow-md"
											>
												<Avatar name={entry.user.name} tone={tone} size={56} />
												<div className="text-center">
													<Text
														size="sm"
														className="font-bold text-(--sea-ink)"
													>
														{entry.user.name}
													</Text>
													<Text
														size="xs"
														className="truncate max-w-full text-(--sea-ink-soft)"
														title={entry.user.email}
													>
														{entry.user.email}
													</Text>
												</div>
												<div className="w-full pt-2">
													<NumberInput
														value={currentValue}
														onChange={(val) => {
															if (val !== null) {
																handleBudgetOverrideChange(
																	entry.user.id,
																	Math.max(0, Number(val)),
																);
															}
														}}
														min={0}
														rightSection={
															savingBudgets.has(entry.user.id) ? (
																<Loader size={14} />
															) : (
																"pts"
															)
														}
														rightSectionWidth={40}
														label="Monthly Budget"
														labelProps={{
															style: {
																fontSize: "11px",
																fontWeight: 600,
																textTransform: "uppercase",
																letterSpacing: "0.05em",
																color: "var(--sea-ink-soft)",
															},
														}}
													/>
												</div>
											</div>
										);
									})}
								</div>

								{usersWithBudgets?.meta &&
									usersWithBudgets.meta.totalPages > 1 && (
										<div className="flex flex-col items-center gap-3 pt-4">
											<Text size="xs" className="text-(--sea-ink-soft)">
												Showing {(page - 1) * limit + 1}–
												{Math.min(page * limit, usersWithBudgets.meta.total)} of{" "}
												{usersWithBudgets.meta.total} users
											</Text>
											<Pagination
												total={usersWithBudgets.meta.totalPages}
												value={page}
												onChange={setPage}
												size="sm"
											/>
										</div>
									)}
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value="post-settings" className="pt-4">
							<Stack gap="lg">
								<div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
									<Stack gap="md">
										<div className="flex items-center gap-2.5">
											<span className="grid h-6 w-6 place-items-center rounded-lg bg-(--lagoon)/15 text-(--lagoon)">
												<Clock size={14} aria-hidden="true" />
											</span>
											<Text
												size="sm"
												className="font-semibold text-(--sea-ink)"
											>
												Content Moderation Windows
											</Text>
										</div>
										<Text className="-mt-1 text-xs text-(--sea-ink-soft)">
											Time windows are in minutes. Changes take effect
											immediately.
										</Text>

										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											{[
												{
													key: "posts.editWindowMinutes",
													label: "Post Edit Window",
													description:
														"Minutes after which posts can no longer be edited",
												},
												{
													key: "posts.deleteWindowMinutes",
													label: "Post Delete Window",
													description:
														"Minutes after which posts can no longer be deleted",
												},
												{
													key: "comments.editWindowMinutes",
													label: "Comment Edit Window",
													description:
														"Minutes after which comments can no longer be edited",
												},
												{
													key: "comments.deleteWindowMinutes",
													label: "Comment Delete Window",
													description:
														"Minutes after which comments can no longer be deleted",
												},
											].map(({ key, label, description }) => (
												<div
													key={key}
													className="rounded-lg border border-(--line) p-4 space-y-2"
												>
													<Text
														size="sm"
														className="font-semibold text-(--sea-ink)"
													>
														{label}
													</Text>
													<Text size="xs" className="text-(--sea-ink-soft)">
														{description}
													</Text>
													<NumberInput
														value={resolvedPostSettings[key]}
														onChange={(val) => onPostSettingChange(key, val)}
														min={0}
														rightSection="min"
														rightSectionWidth={40}
													/>
												</div>
											))}
										</div>

										<div className="flex justify-end pt-2">
											<Button
												leftSection={<Check size={14} aria-hidden="true" />}
												disabled={
													!postSettingsChanged || updateSetting.isPending
												}
												onClick={handleSavePostSettings}
												className="bg-(--lagoon) text-white hover:bg-(--lagoon-deep) disabled:opacity-40"
											>
												Save Changes
											</Button>
										</div>
									</Stack>
								</div>
							</Stack>
						</Tabs.Panel>
					</Tabs>
				</Stack>
			</Paper>
		</div>
	);
}
