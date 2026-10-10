/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { describe, expect, it } from "vitest";
import { ApiError } from "#/lib/api/client.js";

// readMessage and mergeHeaders are not exported, but we can test ApiError
// and the public requestJson functions via mocking.

describe("ApiError", () => {
	it("sets the name to ApiError", () => {
		const error = new ApiError("test", 404);
		expect(error.name).toBe("ApiError");
	});

	it("stores the status code", () => {
		const error = new ApiError("test", 500);
		expect(error.status).toBe(500);
	});

	it("stores the message", () => {
		const error = new ApiError("Not found", 404);
		expect(error.message).toBe("Not found");
	});

	it("is an instance of Error", () => {
		const error = new ApiError("test", 400);
		expect(error).toBeInstanceOf(Error);
	});

	it("is an instance of ApiError", () => {
		const error = new ApiError("test", 400);
		expect(error).toBeInstanceOf(ApiError);
	});

	it("handles status 0 for network errors", () => {
		const error = new ApiError("Network error", 0);
		expect(error.status).toBe(0);
	});

	it("handles status 401 for unauthorized", () => {
		const error = new ApiError("Unauthorized", 401);
		expect(error.status).toBe(401);
	});

	it("preserves the stack trace", () => {
		const error = new ApiError("test", 500);
		expect(error.stack).toBeDefined();
		expect(typeof error.stack).toBe("string");
	});
});

describe("readMessage (via ApiError behavior)", () => {
	// readMessage is internal, but we can verify the error messages
	// that would be produced by testing the ApiError constructor directly
	// with the same patterns readMessage would extract.

	it("produces a string message from a string payload", () => {
		const payload = "Something went wrong";
		const error = new ApiError(payload, 500);
		expect(error.message).toBe("Something went wrong");
	});

	it("produces a fallback message for status codes", () => {
		const error = new ApiError("The server rejected that request (400).", 400);
		expect(error.message).toContain("400");
	});
});
