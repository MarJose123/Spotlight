/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { useEffect, useRef, useState } from "react";
import { authorizationHeaders } from "#/lib/session";

/**
 * Fetch an attachment URL with auth headers and return a blob URL that the
 * browser can render in <img> / <video> tags. External URLs (not starting with
 * /api/) are returned unchanged because they do not go through the proxy.
 *
 * Returns `undefined` while loading or when no auth token is available — the
 * caller should defer rendering the media element until the blob URL is ready,
 * so the raw API URL is never fetched by the browser without auth headers.
 */
export function useAttachmentUrl(url: string): string | undefined {
	const [blobUrl, setBlobUrl] = useState<string | undefined>();
	const unmountedRef = useRef(false);

	useEffect(() => {
		unmountedRef.current = false;

		// External URLs (GIFs, etc.) bypass the proxy — no auth needed
		if (url && !url.startsWith("/api/")) {
			setBlobUrl(url);
			return;
		}

		if (!url) {
			setBlobUrl(undefined);
			return;
		}

		const { authorization } = authorizationHeaders();
		if (!authorization) {
			setBlobUrl(undefined);
			return;
		}

		let cancelled = false;
		fetch(url, { headers: { authorization } })
			.then((res) => {
				if (!res.ok) {
					cancelled = true;
					return;
				}
				return res.blob();
			})
			.then((blob) => {
				if (cancelled || unmountedRef.current || !blob) return;
				const objUrl = URL.createObjectURL(blob);
				setBlobUrl(objUrl);
			})
			.catch(() => {
				// Silently fail — the image simply won't render
			});

		return () => {
			cancelled = true;
		};
	}, [url]);

	// Clean up blob URL on unmount
	useEffect(() => {
		return () => {
			if (blobUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(blobUrl);
			}
		};
	}, [blobUrl]);

	return blobUrl;
}
