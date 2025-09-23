import { validateUsername } from "../../src/auth/user";

describe("validateUsername", () => {
    it("returns true for valid usernames with letters only", () => {
        expect(validateUsername("alice")).toBe(true);
        expect(validateUsername("Bob")).toBe(true);
        expect(validateUsername("USERNAME")).toBe(true);
    });

    it("returns true for valid usernames with numbers", () => {
        expect(validateUsername("user123")).toBe(true);
        expect(validateUsername("123user")).toBe(true);
        expect(validateUsername("u2s3e4r")).toBe(true);
    });

    it("returns true for valid usernames with underscores", () => {
        expect(validateUsername("user_name")).toBe(true);
        expect(validateUsername("_user")).toBe(true);
        expect(validateUsername("user_")).toBe(true);
        expect(validateUsername("_")).toBe(true);
    });

    it("returns true for valid mixed alphanumeric with underscores", () => {
        expect(validateUsername("user_123")).toBe(true);
        expect(validateUsername("admin_2024")).toBe(true);
        expect(validateUsername("_test_user_1")).toBe(true);
    });

    it("returns false for usernames with special characters", () => {
        expect(validateUsername("user@domain")).toBe(false);
        expect(validateUsername("user-name")).toBe(false);
        expect(validateUsername("user.name")).toBe(false);
        expect(validateUsername("user#123")).toBe(false);
        expect(validateUsername("user$")).toBe(false);
        expect(validateUsername("user%")).toBe(false);
        expect(validateUsername("user!")).toBe(false);
    });

    it("returns false for usernames with spaces", () => {
        expect(validateUsername("user name")).toBe(false);
        expect(validateUsername(" user")).toBe(false);
        expect(validateUsername("user ")).toBe(false);
        expect(validateUsername(" ")).toBe(false);
    });

    it("returns false for empty string", () => {
        expect(validateUsername("")).toBe(false);
    });

    it("returns false for usernames with newlines and tabs", () => {
        expect(validateUsername("user\nname")).toBe(false);
        expect(validateUsername("user\tname")).toBe(false);
        expect(validateUsername("\n")).toBe(false);
        expect(validateUsername("\t")).toBe(false);
    });

    it("returns false for usernames with unicode characters", () => {
        expect(validateUsername("café")).toBe(false);
        expect(validateUsername("user™")).toBe(false);
        expect(validateUsername("🦄")).toBe(false);
        expect(validateUsername("user中文")).toBe(false);
    });

    it("handles single character usernames", () => {
        expect(validateUsername("a")).toBe(true);
        expect(validateUsername("Z")).toBe(true);
        expect(validateUsername("1")).toBe(true);
        expect(validateUsername("_")).toBe(true);
    });

    it("handles long usernames", () => {
        const longUsername = "a".repeat(100);
        expect(validateUsername(longUsername)).toBe(true);

        const longUsernameWithUnderscore = "_" + "a".repeat(99);
        expect(validateUsername(longUsernameWithUnderscore)).toBe(true);
    });
});
