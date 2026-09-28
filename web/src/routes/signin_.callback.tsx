/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import {
	Alert,
	Button,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { completeProviderSignIn, errorMessage } from "../lib/auth";

type CallbackSearch = {
	code?: string;
	state?: string;
	error?: string;
	error_description?: string;
};

function readString(value: unknown): string | undefined {
	return typeof value === "string" && value !== "" ? value : undefined;
}

export const Route = createFileRoute("/signin_/callback")({
	validateSearch: (search: Record<string, unknown>): CallbackSearch => ({
		code: readString(search.code),
		state: readString(search.state),
		error: readString(search.error),
		error_description: readString(search.error_description),
	}),
	head: () => ({
		meta: [{ title: "Completing sign-in · Spotlight" }],
	}),
	component: SignInCallback,
});

function SignInCallback() {
	const {
		code,
		state,
		error,
		error_description: errorDescription,
	} = Route.useSearch();
	const [failure, setFailure] = useState<string | null>(null);
	const started = useRef(false);

	useEffect(() => {
		if (started.current) {
			return;
		}
		started.current = true;

		if (error) {
			setFailure(
				errorDescription ?? `The provider rejected this sign-in (${error}).`,
			);
			return;
		}

		if (!code || !state) {
			setFailure(
				"This page is only reached from a provider redirect. Start again from the sign-in page.",
			);
			return;
		}

		completeProviderSignIn({ code, state })
			.then((target) => {
				window.location.assign(target);
			})
			.catch((reason: unknown) => {
				setFailure(
					errorMessage(
						reason,
						"Sign-in could not be completed. Start again from the sign-in page.",
					),
				);
			});
	}, [code, state, error, errorDescription]);

	return (
		<main className="page-wrap px-4 py-16">
			<section className="mx-auto w-full max-w-md">
				<Stack align="center" gap="xs" mb="lg">
					<Text className="island-kicker">Internal recognition</Text>
					<Title order={1} fz={{ base: 40, sm: 56 }}>
						Spotlight
					</Title>
				</Stack>

				<Paper radius="lg" p="lg" withBorder className="rise-in">
					<Stack gap="lg">
						{failure === null ? (
							<Group gap="sm" wrap="nowrap">
								<Loader size="sm" />
								<Text size="sm" c="bright">
									Finishing sign-in…
								</Text>
							</Group>
						) : (
							<>
								<Alert
									color="red"
									variant="light"
									icon={<TriangleAlert size={16} aria-hidden="true" />}
								>
									{failure}
								</Alert>

								<Button
									radius="xl"
									onClick={() => {
										window.location.assign("/signin");
									}}
								>
									Back to sign in
								</Button>
							</>
						)}
					</Stack>
				</Paper>
			</section>
		</main>
	);
}
