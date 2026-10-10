/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useMatches,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import Footer from "#/components/Footer";
import GuestHeader from "#/components/GuestHeader";
import {
	StatusErrorBoundary,
	StatusNotFound,
} from "#/components/status/boundaries";
import TanStackQueryDevtools from "#/integrations/tanstack-query/devtools";
import TanstackQueryProvider from "#/integrations/tanstack-query/root-provider";
import type { Session } from "#/lib/session";
import { colorSchemeManager, theme } from "#/theme";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	session: Session | null;
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.setAttribute('data-mantine-color-scheme',resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Spotlight",
			},
			{
				name: "description",
				content:
					"Spotlight is an internal recognition tool that helps teams celebrate and appreciate their coworkers with commendations and shout-outs.",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "48x48",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: StatusNotFound,
	errorComponent: StatusErrorBoundary,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const matches = useMatches();
	const fullBleed = matches.some((match) =>
		match.id.startsWith("/_authenticated"),
	);
	const queryClient = useQueryClient();

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static build-time constant, not user input */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
				<TanstackQueryProvider queryClient={queryClient}>
					<MantineProvider
						theme={theme}
						defaultColorScheme="auto"
						colorSchemeManager={colorSchemeManager}
					>
						<Notifications layout="stacked" />
						{!fullBleed && <GuestHeader />}
						{children}
						{!fullBleed && <Footer />}
					</MantineProvider>
				</TanstackQueryProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
