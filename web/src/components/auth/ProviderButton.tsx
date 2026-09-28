/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { ButtonProps } from "@mantine/core";
import { Button } from "@mantine/core";
import { KeyRound } from "lucide-react";
import { type ReactNode, useState } from "react";
import { beginProviderSignIn, errorMessage } from "../../lib/auth";

interface ProviderMeta {
	label: string;
	mark: ReactNode;
}

const MARK_SIZE = 26;

/**
 * The Zoho mark is a ~3:1 wordmark, so it needs more width than the square
 * marks to stay legible at button size.
 */
const ZOHO_WIDTH = 42;

function GoogleMark() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={MARK_SIZE}
			height={MARK_SIZE}
			aria-hidden="true"
			focusable="false"
		>
			<path
				fill="#4285F4"
				d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.56-5.17 3.56-8.87Z"
			/>
			<path
				fill="#34A853"
				d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
			/>
			<path
				fill="#FBBC05"
				d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
			/>
			<path
				fill="#EA4335"
				d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
			/>
		</svg>
	);
}

function MicrosoftMark() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={MARK_SIZE}
			height={MARK_SIZE}
			aria-hidden="true"
			focusable="false"
		>
			<rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
			<rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
			<rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
			<rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
		</svg>
	);
}

function GithubMark() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={MARK_SIZE}
			height={MARK_SIZE}
			aria-hidden="true"
			focusable="false"
		>
			<path
				fill="currentColor"
				d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
			/>
		</svg>
	);
}

function GitlabMark() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={MARK_SIZE}
			height={MARK_SIZE}
			aria-hidden="true"
			focusable="false"
		>
			<path
				fill="#FC6D26"
				d="m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z"
			/>
		</svg>
	);
}

function ZohoMark() {
	return (
		<svg
			viewBox="8 13 1009 340"
			width={ZOHO_WIDTH}
			height={ZOHO_WIDTH * (340 / 1009)}
			aria-hidden="true"
			focusable="false"
		>
			<path
				fill="#089949"
				d="M458.102 353C450.402 353 442.602 351.4 435.102 348.1L275.102 276.8C246.502 264.1 233.602 230.4 246.302 201.8L317.602 41.7998C330.302 13.1998 364.002 0.299757 392.602 12.9998L552.602 84.2998C581.202 96.9998 594.103 130.7 581.403 159.3L510.103 319.3C500.603 340.5 479.802 353 458.102 353ZM448.402 318.1C460.502 323.5 474.702 318 480.102 306L551.403 146C556.803 133.9 551.302 119.7 539.302 114.3L379.202 42.9998C367.102 37.5998 352.902 43.0998 347.502 55.0998L276.202 215.1C270.802 227.2 276.302 241.4 288.302 246.8L448.402 318.1Z"
			/>
			<path
				fill="#F9B21D"
				d="M960 353.1H784.8C753.5 353.1 728 327.6 728 296.3V121.1C728 89.7998 753.5 64.2998 784.8 64.2998H960C991.3 64.2998 1016.8 89.7998 1016.8 121.1V296.3C1016.8 327.6 991.3 353.1 960 353.1ZM784.8 97.0998C771.6 97.0998 760.8 107.9 760.8 121.1V296.3C760.8 309.5 771.6 320.3 784.8 320.3H960C973.2 320.3 984 309.5 984 296.3V121.1C984 107.9 973.2 97.0998 960 97.0998H784.8Z"
			/>
			<path
				fill="#E42527"
				d="M303.902 153.2L280.302 206C280.002 206.6 279.702 207.1 279.402 207.6L288.602 264.4C290.702 277.5 281.802 289.8 268.802 291.9L95.8021 319.9C89.5021 320.9 83.1021 319.4 77.9021 315.7C72.7021 312 69.3021 306.4 68.3021 300.1L40.3021 127.1C39.3021 120.8 40.8021 114.4 44.5021 109.2C48.2021 104 53.8021 100.6 60.1021 99.5998L233.102 71.5998C234.402 71.3998 235.702 71.2998 236.902 71.2998C248.402 71.2998 258.702 79.6998 260.602 91.4998L269.902 148.7L294.302 93.9998L293.002 86.2998C288.002 55.3998 258.802 34.2998 227.902 39.2998L54.9021 67.2998C40.0021 69.5998 26.8021 77.6998 18.0021 89.9998C9.10209 102.3 5.60209 117.3 8.00209 132.3L36.0021 305.3C38.4021 320.3 46.5021 333.4 58.8021 342.3C68.5021 349.4 80.0021 353 91.9021 353C94.9021 353 98.0021 352.8 101.102 352.3L274.102 324.3C305.002 319.3 326.102 290.1 321.102 259.2L303.902 153.2Z"
			/>
			<path
				fill="#226DB4"
				d="M511.404 235.8L536.804 178.9L529.604 126C528.704 119.7 530.404 113.4 534.304 108.3C538.204 103.2 543.804 99.9001 550.204 99.1001L723.804 75.5001C724.904 75.4001 726.004 75.3001 727.104 75.3001C732.304 75.3001 737.304 77.0001 741.604 80.2001C742.404 80.8001 743.104 81.5001 743.804 82.1001C751.504 74.0001 761.604 68.2001 772.904 65.7001C769.704 61.3001 765.904 57.4001 761.404 54.0001C749.304 44.8001 734.404 40.9001 719.404 42.9001L545.604 66.5001C530.604 68.5001 517.204 76.3001 508.104 88.4001C498.904 100.5 495.004 115.4 497.004 130.4L511.404 235.8Z"
			/>
			<path
				fill="#226DB4"
				d="M806.806 265.101L784.006 97.1006C771.206 97.5006 760.906 108.101 760.906 121.001V170.301L774.406 269.501C775.306 275.801 773.606 282.101 769.706 287.201C765.806 292.301 760.206 295.601 753.806 296.401L580.206 320.001C573.906 320.901 567.606 319.201 562.506 315.301C557.406 311.401 554.106 305.801 553.306 299.401L545.306 240.501L519.906 297.401L520.806 303.801C522.806 318.801 530.606 332.201 542.706 341.301C552.706 348.901 564.606 352.901 577.006 352.901C579.606 352.901 582.206 352.701 584.806 352.401L758.206 329.001C773.206 327.001 786.606 319.201 795.706 307.101C804.906 295.001 808.806 280.101 806.806 265.101Z"
			/>
		</svg>
	);
}

const PROVIDERS: Record<string, ProviderMeta> = {
	github: { label: "GitHub", mark: <GithubMark /> },
	gitlab: { label: "GitLab", mark: <GitlabMark /> },
	google: { label: "Google", mark: <GoogleMark /> },
	microsoft: { label: "Microsoft", mark: <MicrosoftMark /> },
	zoho: { label: "Zoho", mark: <ZohoMark /> },
};

function providerLabel(provider: string): string {
	return provider.charAt(0).toUpperCase() + provider.slice(1);
}

interface ProviderButtonProps extends ButtonProps {
	/** Id as reported by `GET /auth/providers`. */
	provider: string;
	/** Path the visitor asked for before being sent to the sign-in page. */
	redirectTo?: string;
	onError?: (message: string) => void;
}

/** Providers added later still render, with a generic mark and their id. */
export function ProviderButton({
	provider,
	redirectTo,
	onError,
	...props
}: ProviderButtonProps) {
	const meta = PROVIDERS[provider.toLowerCase()];
	const label = meta?.label ?? providerLabel(provider);
	const [pending, setPending] = useState(false);

	const start = () => {
		setPending(true);

		beginProviderSignIn(provider, redirectTo).catch((error: unknown) => {
			setPending(false);
			onError?.(
				errorMessage(error, `Could not start the ${label} sign-in. Try again.`),
			);
		});
	};

	return (
		<Button
			type="button"
			variant="default"
			radius="xl"
			loading={pending}
			leftSection={
				meta?.mark ?? <KeyRound size={MARK_SIZE} aria-hidden="true" />
			}
			onClick={start}
			{...props}
		>
			{label}
		</Button>
	);
}
