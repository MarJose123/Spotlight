/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { describe, expect, it } from "vitest";
import { signInSchema } from "#/lib/schemas/auth.js";

describe("signInSchema", () => {
	it("accepts valid email and password", () => {
		const result = signInSchema.safeParse({
			email: "user@example.com",
			password: "secret123",
		});
		expect(result.success).toBe(true);
	});

	it("accepts email with subaddressing", () => {
		const result = signInSchema.safeParse({
			email: "user+tag@example.com",
			password: "pass",
		});
		expect(result.success).toBe(true);
	});

	it("accepts email with numbers and hyphens", () => {
		const result = signInSchema.safeParse({
			email: "user-123@example-2.com",
			password: "x",
		});
		expect(result.success).toBe(true);
	});

	it("accepts single character password", () => {
		const result = signInSchema.safeParse({
			email: "a@b.com",
			password: "x",
		});
		expect(result.success).toBe(true);
	});

	it("accepts extra fields but still validates required fields", () => {
		const result = signInSchema.safeParse({
			email: "user@example.com",
			password: "secret",
			extra: "field",
		});
		// Zod strict mode would reject extra fields, but this schema is not strict
		expect(result.success).toBe(true);
	});

	it("rejects missing email", () => {
		const result = signInSchema.safeParse({ password: "secret" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.length).toBeGreaterThan(0);
		}
	});

	it("rejects missing password", () => {
		const result = signInSchema.safeParse({ email: "user@example.com" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.length).toBeGreaterThan(0);
		}
	});

	it("rejects empty password", () => {
		const result = signInSchema.safeParse({
			email: "user@example.com",
			password: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe("Enter your password");
		}
	});

	it("rejects invalid email without @", () => {
		const result = signInSchema.safeParse({
			email: "not-an-email",
			password: "secret",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"Enter a valid email address",
			);
		}
	});

	it("rejects invalid email without domain", () => {
		const result = signInSchema.safeParse({
			email: "user@",
			password: "secret",
		});
		expect(result.success).toBe(false);
	});

	it("rejects email with spaces", () => {
		const result = signInSchema.safeParse({
			email: "user @example.com",
			password: "secret",
		});
		expect(result.success).toBe(false);
	});

	it("rejects completely empty object", () => {
		const result = signInSchema.safeParse({});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.length).toBe(2);
		}
	});

	it("rejects null email", () => {
		const result = signInSchema.safeParse({
			email: null as unknown as string,
			password: "secret",
		});
		expect(result.success).toBe(false);
	});
});
