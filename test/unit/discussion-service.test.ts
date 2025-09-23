import { extractMentionedUsers } from "../../src/discussion/discussion-service";

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
