/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Modal, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GiphyGif } from "#/lib/api/gif";
import { useSearchGifs, useTrendingGifsInfinite } from "#/lib/api-queries";

export interface GifPickerProps {
	opened: boolean;
	onClose: () => void;
	onSelect: (gif: GiphyGif) => void;
}

export function GifPicker({ opened, onClose, onSelect }: GifPickerProps) {
	const [inputValue, setInputValue] = useState("");
	const [debouncedQuery] = useDebouncedValue(inputValue, 300);
	const query = debouncedQuery.trim();
	const isSearching = query.length > 0;

	// Pausing the trending query while a search is active keeps its pages out of
	// the search grid and stops background pagination the user never sees.
	const {
		data: trendingPages,
		fetchNextPage,
		hasNextPage,
		isLoading: isLoadingTrending,
		isFetchingNextPage,
		isError: isErrorTrending,
	} = useTrendingGifsInfinite({ enabled: opened && !isSearching });
	const trendingGifs = trendingPages?.pages.flatMap((page) => page.data) ?? [];

	const {
		data: searchData = [],
		isLoading: isLoadingSearch,
		isError: isErrorSearch,
	} = useSearchGifs(query);

	const gifs = isSearching ? searchData : trendingGifs;
	const isLoading = isSearching ? isLoadingSearch : isLoadingTrending;
	const isError = isSearching ? isErrorSearch : isErrorTrending;

	// Sentinel at the bottom of the grid triggers the next page load. It is held
	// in state rather than a plain ref because Mantine mounts the modal content a
	// frame after `opened` flips, so an effect keyed on `opened` runs before the
	// sentinel exists and would never attach.
	const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	// Mirrored into a ref so the observer reads fresh pagination state without
	// being torn down and rebuilt on every render.
	const paginationRef = useRef({
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	});

	useEffect(() => {
		paginationRef.current = { hasNextPage, isFetchingNextPage, fetchNextPage };
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	useEffect(() => {
		if (!opened || isSearching || !sentinel) return;

		const el = sentinel;
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				const pagination = paginationRef.current;
				if (
					entry.isIntersecting &&
					pagination.hasNextPage &&
					!pagination.isFetchingNextPage
				) {
					pagination.fetchNextPage();
				}
			},
			{ root: scrollContainer, rootMargin: "64px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [opened, isSearching, sentinel]);

	// Trending and search share one scroll container, so a new query starts the
	// grid at the top instead of inheriting the previous list's scroll offset.
	const handleInputChange = useCallback((value: string) => {
		setInputValue(value);
		const scrollContainer = scrollContainerRef.current;
		if (scrollContainer) {
			scrollContainer.scrollTop = 0;
		}
	}, []);

	const handleClose = useCallback(() => {
		setInputValue("");
		onClose();
	}, [onClose]);

	const handleSelect = useCallback(
		(gif: GiphyGif) => {
			onSelect(gif);
			handleClose();
		},
		[onSelect, handleClose],
	);

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title="Choose a GIF"
			centered
			size="auto"
			withinPortal
		>
			<div className="flex h-[360px] w-[380px] flex-col">
				{/* GIF grid */}
				<div
					ref={scrollContainerRef}
					className="min-h-0 flex-1 overflow-y-auto"
				>
					{isLoading && gifs.length === 0 ? (
						<div className="flex h-full items-center justify-center text-[13px] text-[var(--feed-ink-dim)]">
							Loading...
						</div>
					) : isError ? (
						<div className="flex h-full items-center justify-center text-[13px] text-[var(--feed-danger)]">
							Failed to load GIFs
						</div>
					) : gifs.length === 0 ? (
						<div className="flex h-full items-center justify-center text-[13px] text-[var(--feed-ink-dim)]">
							No GIFs found
						</div>
					) : (
						<div className="grid grid-cols-2 gap-1 p-1">
							{gifs.map((gif) => (
								<button
									key={gif.id}
									type="button"
									onClick={() => handleSelect(gif)}
									className="group relative overflow-hidden rounded"
									title={gif.title}
								>
									<img
										src={gif.url}
										alt={gif.title}
										className="h-28 w-full object-cover transition-opacity group-hover:opacity-70"
										loading="lazy"
									/>
								</button>
							))}
						</div>
					)}

					{!isSearching && isFetchingNextPage && (
						<div className="py-2 text-center text-[12px] text-[var(--feed-ink-dim)]">
							Loading more...
						</div>
					)}

					{/* Infinite scroll sentinel — always mounted so observer stays connected */}
					<div ref={setSentinel} className="h-1" />
				</div>

				{/* Search input */}
				<div className="border-t border-[var(--feed-line)] p-2">
					<TextInput
						placeholder="Search GIFs..."
						value={inputValue}
						onChange={(e) => handleInputChange(e.target.value)}
						leftSection={<Search size={14} />}
						rightSection={
							inputValue ? (
								<button
									type="button"
									onClick={() => handleInputChange("")}
									className="flex items-center justify-center"
								>
									<X size={14} />
								</button>
							) : undefined
						}
					/>
				</div>
			</div>
		</Modal>
	);
}
