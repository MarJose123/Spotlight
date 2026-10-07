/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { notifications } from "@mantine/notifications";
import {
	MutationCache,
	QueryCache,
	QueryClient,
	type QueryClientConfig,
	QueryClientProvider,
} from "@tanstack/react-query";
import { ApiError } from "#/lib/api";
import { readSession } from "#/lib/session";

function showRateLimitNotification() {
	notifications.show({
		title: "Too many requests",
		message:
			"You are sending requests too quickly. Please wait a moment and try again.",
		color: "orange",
	});
}

const queryCache = new QueryCache({
	onError: (error) => {
		if (error instanceof ApiError && error.status === 429) {
			showRateLimitNotification();
		}
	},
});

const mutationCache = new MutationCache({
	onError: (error) => {
		if (error instanceof ApiError && error.status === 429) {
			showRateLimitNotification();
		}
	},
});

const defaultQueryClientConfig: QueryClientConfig = {
	queryCache,
	mutationCache,
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 5,
			refetchOnWindowFocus: false,
		},
	},
};

export function getContext() {
	const queryClient = new QueryClient(defaultQueryClientConfig);
	const session = readSession();

	return {
		queryClient,
		session,
	};
}

export default function TanstackQueryProvider({
	children,
	queryClient,
}: {
	children: React.ReactNode;
	queryClient: QueryClient;
}) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
