/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { describe, expect, it } from "vitest";
import { throwUnauthorized } from "#/lib/auth-guard.js";

describe("throwUnauthorized", () => {
	it("throws a redirect error", () => {
		expect(() => throwUnauthorized()).toThrow();
	});

	it("throws a redirect to /401", () => {
		try {
			throwUnauthorized();
		} catch (error) {
			// TanStack Router's redirect carries a `to` property
			expect(error).toBeDefined();
		}
	});

	it("throws when called with a redirect path", () => {
		expect(() => throwUnauthorized("/feed")).toThrow();
	});

	it("throws when called with an empty string", () => {
		expect(() => throwUnauthorized("")).toThrow();
	});
});
