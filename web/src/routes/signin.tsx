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
	Divider,
	Group,
	Paper,
	PasswordInput,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { ProviderButton } from "../components/auth/ProviderButton";
import { fetchEnabledProviders } from "../lib/api";
import {
	errorMessage,
	postSignInTarget,
	signInWithPassword,
} from "../lib/auth";
import { type SignInValues, signInSchema } from "../lib/schemas/auth";

type SignInSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/signin")({
	validateSearch: (search: Record<string, unknown>): SignInSearch => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	loader: () => fetchEnabledProviders(),
	head: () => ({
		meta: [{ title: "Sign in · Spotlight" }],
	}),
	component: SignIn,
});

function SignIn() {
	const { ids, reachable } = Route.useLoaderData();
	const { redirect } = Route.useSearch();
	const hasSso = ids.length > 0;
	const [failure, setFailure] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const form = useForm<SignInValues>({
		initialValues: {
			email: "",
			password: "",
		},

		validate: zod4Resolver(signInSchema),
	});

	const submit = async (values: SignInValues) => {
		setFailure(null);
		setSubmitting(true);

		try {
			await signInWithPassword(values);
			// A full load, so the first render after sign-in already sees the session.
			window.location.assign(postSignInTarget(redirect));
		} catch (error) {
			setSubmitting(false);
			setFailure(errorMessage(error, "Sign-in failed. Try again."));
		}
	};

	return (
		<main className="page-wrap px-4 py-16">
			<section className="mx-auto w-full max-w-md">
				<Stack align="center" gap="xs" mb="lg">
					<Text className="island-kicker">Internal recognition</Text>
					<Title order={1} fz={{ base: 40, sm: 56 }}>
						Spotlight
					</Title>
					<Text c="dimmed" size="sm" ta="center">
						Celebrate great work. Recognize your teammates.
					</Text>
				</Stack>

				<Paper radius="lg" p="lg" withBorder className="rise-in">
					<Stack gap="lg">
						<div>
							<Text size="lg" fw={500} c="bright">
								{hasSso
									? "Welcome to Spotlight, sign in with"
									: "Sign in to Spotlight"}
							</Text>

							{hasSso && (
								// A row would squeeze long provider names into ellipses.
								<SimpleGrid
									cols={ids.length === 1 ? 1 : { base: 1, xs: 2 }}
									spacing="xs"
									mt="md"
								>
									{ids.map((provider) => (
										<ProviderButton
											key={provider}
											provider={provider}
											redirectTo={redirect}
											onError={setFailure}
										/>
									))}
								</SimpleGrid>
							)}
						</div>

						{hasSso && (
							<Divider label="Or continue with email" labelPosition="center" />
						)}

						{failure && (
							<Alert
								color="red"
								variant="light"
								icon={<TriangleAlert size={16} aria-hidden="true" />}
							>
								{failure}
							</Alert>
						)}

						{!reachable && (
							<Alert
								color="yellow"
								variant="light"
								icon={<TriangleAlert size={16} aria-hidden="true" />}
							>
								Single sign-on providers could not be loaded. Refresh the page
								to try again.
							</Alert>
						)}

						<form
							onSubmit={form.onSubmit((values) => {
								void submit(values);
							})}
						>
							<Stack>
								<TextInput
									withAsterisk
									label="Email"
									placeholder="you@company.com"
									autoComplete="email"
									radius="md"
									{...form.getInputProps("email")}
								/>

								<PasswordInput
									withAsterisk
									label="Password"
									placeholder="Your password"
									autoComplete="current-password"
									radius="md"
									{...form.getInputProps("password")}
								/>
							</Stack>

							<Group justify="space-between" align="center" mt="xl" gap="sm">
								<Text size="xs" c="dimmed">
									Accounts are provisioned by an administrator.
								</Text>
								<Button type="submit" radius="xl" loading={submitting}>
									Sign in
								</Button>
							</Group>
						</form>
					</Stack>
				</Paper>
			</section>
		</main>
	);
}
