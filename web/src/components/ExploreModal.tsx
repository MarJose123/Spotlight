/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Flex, Modal, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { Link } from "@tanstack/react-router";
import { LayoutGrid, Search, Store, Users } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { useRef, useState } from "react";

type Icon = ComponentType<
	SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }
>;

const SERVICES: Array<{
	id: string;
	title: string;
	description: string;
	icon: Icon;
	gradient: string;
}> = [
	{
		id: "users",
		title: "Users",
		description: "Browse all employee records",
		icon: Users,
		gradient: "from-blue-500 to-cyan-400",
	},
	{
		id: "stores",
		title: "Stores",
		description: "View merchants to redeem your points",
		icon: Store,
		gradient: "from-emerald-500 to-teal-400",
	},
];

export interface ExploreModalProps {
	opened: boolean;
	onClose: () => void;
}

export function ExploreModal({ opened, onClose }: ExploreModalProps) {
	const [query, setQuery] = useState("");
	const [debouncedQuery] = useDebouncedValue(query, 200);
	const inputRef = useRef<HTMLInputElement>(null);

	const filtered = SERVICES.filter(
		(s) =>
			s.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
			s.description.toLowerCase().includes(debouncedQuery.toLowerCase()),
	);

	return (
		<Modal
			opened={opened}
			onClose={() => {
				setQuery("");
				onClose();
			}}
			onEnterTransitionEnd={() => {
				inputRef.current?.focus();
			}}
			title={
				<div className="flex items-center gap-2">
					<LayoutGrid
						size={18}
						className="text-(--lagoon)"
						aria-hidden="true"
					/>
					<div>
						<p className="m-0 text-base font-semibold text-(--sea-ink)">
							Explore Services
						</p>
						<p className="m-0 text-xs text-(--sea-ink-soft)">
							Discover tools and features
						</p>
					</div>
				</div>
			}
			centered
			size="md"
			withinPortal
		>
			<div className="flex flex-col gap-3">
				<TextInput
					ref={inputRef}
					leftSection={<Search size={14} />}
					placeholder="Search services…"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="bg-(--surface) transition-colors hover:bg-(--link-bg-hover) "
				/>
				<Flex direction="row" justify="center" gap="md" p="md">
					{filtered.map((service) => {
						const ServiceIcon = service.icon;
						return (
							<Link
								key={service.id}
								// Routes for services are not yet defined in the route tree.
								// @ts-expect-error - dynamic route not yet in route tree
								to={`/${service.id}`}
								className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-transparent bg-(--surface) px-4 py-6 text-center transition-colors hover:border-(--lagoon) hover:bg-(--lagoon)/10"
							>
								<span
									className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${service.gradient} text-white`}
								>
									<ServiceIcon size={20} strokeWidth={2} aria-hidden="true" />
								</span>
								<div className="space-y-1">
									<p className="m-0 text-sm font-semibold text-(--sea-ink)">
										{service.title}
									</p>
									<p className="m-0 text-[11px] text-(--sea-ink-soft)">
										{service.description}
									</p>
								</div>
							</Link>
						);
					})}
				</Flex>

				{filtered.length === 0 && (
					<div className="flex flex-col items-center gap-2 py-8 text-(--sea-ink-soft)">
						<Search size={24} strokeWidth={1.5} aria-hidden="true" />
						<p className="m-0 text-sm">No services found</p>
					</div>
				)}
			</div>
		</Modal>
	);
}
