import {
    extractMentionedUsers,
    isValidReference,
} from "../../src/discussion/discussion-service";

describe("extractMentionedUsers", () => {
    it("returns empty array when content has no mentions", () => {
        expect(extractMentionedUsers("Hello world")).toEqual([]);
    });

    it("returns empty array for empty string", () => {
        expect(extractMentionedUsers("")).toEqual([]);
    });

    it("extracts single user mention", () => {
        expect(extractMentionedUsers("Hello @alice how are you?")).toEqual([
            "alice",
        ]);
    });

    it("extracts user mentions with numbers", () => {
        expect(extractMentionedUsers("Hello @user123  !")).toEqual(["user123"]);
    });

    it("handles duplicate mentions by returning unique users only", () => {
        expect(
            extractMentionedUsers("Hello @alice  and @alice  again!")
        ).toEqual(["alice"]);
    });

    it("extract mentions with no space", () => {
        expect(extractMentionedUsers("Hello @alice!")).toEqual(["alice"]);
    });

    it("extracts mentions with more than double spaces", () => {
        expect(extractMentionedUsers("Hello @alice   how are you?")).toEqual([
            "alice",
        ]);
    });

    it("extracts mentions with comma", () => {
        expect(extractMentionedUsers("Hello @alice, how are you?")).toEqual([
            "alice",
        ]);
    });

    it("extracts mentions at the beginning of content", () => {
        expect(extractMentionedUsers("@alice  hello there")).toEqual(["alice"]);
    });

    it("extracts mentions at the end of content", () => {
        expect(extractMentionedUsers("Hello there @alice!")).toEqual(["alice"]);
    });

    it("handles mixed case usernames", () => {
        expect(extractMentionedUsers("Hello @Alice  and @BOB  !")).toEqual([
            "Alice",
            "BOB",
        ]);
    });

    it("handles mentions with special characters around them", () => {
        expect(extractMentionedUsers("(@alice  ) and [@bob  ]")).toEqual([
            "alice",
            "bob",
        ]);
    });

    it("does not extract @ symbols without valid usernames", () => {
        expect(extractMentionedUsers("Email: test@example.com  ")).toEqual([]);
    });

    it("should extract mentions with different end characters", () => {
        expect(extractMentionedUsers("Hello @user-name  !")).toEqual(["user"]);
        expect(extractMentionedUsers("Hello @user.name  !")).toEqual(["user"]);
        expect(extractMentionedUsers("Hello @user@domain  !")).toEqual([
            "user",
        ]);
    });

    it("handles newlines and tabs in content", () => {
        expect(
            extractMentionedUsers("Hello @alice  \nhow are you @bob  ?")
        ).toEqual(["alice", "bob"]);
    });

    it("extracts mentions from multiline content", () => {
        const content = `Line 1 with @alice
    Line 2 with @bob
    Line 3 with @charlie  `;
        expect(extractMentionedUsers(content)).toEqual([
            "alice",
            "bob",
            "charlie",
        ]);
    });
});

describe("isValidReference", () => {
    it("returns true for valid references with alphanumeric parts", () => {
        expect(isValidReference("video1.1")).toBe(true);
        expect(isValidReference("A1B2.c3D4")).toBe(true);
        expect(isValidReference("123.456")).toBe(true);
    });

    it("returns false for references without a dot or with extra dots", () => {
        expect(isValidReference("video1")).toBe(false);
        expect(isValidReference("video1.")).toBe(false);
        expect(isValidReference(".1")).toBe(false);
        expect(isValidReference("video..1")).toBe(false);
        expect(isValidReference("video1.1.1")).toBe(false);
    });

    it("returns false for references with non-alphanumeric characters", () => {
        expect(isValidReference("video-1.1")).toBe(false);
        expect(isValidReference("video1._1")).toBe(false);
        expect(isValidReference("video_1.2")).toBe(false);
    });

    it("returns false for references with spaces or empty string", () => {
        expect(isValidReference("")).toBe(false);
        expect(isValidReference(" video1.1")).toBe(false);
        expect(isValidReference("video1.1 ")).toBe(false);
        expect(isValidReference("video 1.1")).toBe(false);
    });
});
