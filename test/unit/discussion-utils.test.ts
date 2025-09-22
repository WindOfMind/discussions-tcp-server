import { toDiscussionResponse } from "../../src/message/handler/discussion-utils";
import { DiscussionWithComments, Comment } from "../../src/discussion/types";

function makeComment(overrides: Partial<Comment> = {}): Comment {
    return {
        id: "c1",
        discussionId: "d1",
        content: "Test content",
        userName: "User",
        ts: 123,
        ...overrides,
    };
}

function makeDiscussion(comments: Comment[] = []): DiscussionWithComments {
    return {
        id: "d1",
        reference: "ref",
        referenceStart: "start",
        commentIds: comments.map((c) => c.id),
        ts: 456,
        comments,
    };
}

describe("toDiscussionResponse", () => {
    it("returns empty string when discussion is null", () => {
        expect(toDiscussionResponse(null)).toBe("");
    });

    it("returns response with id and reference and empty list when discussion has no comments", () => {
        const discussion = makeDiscussion([]);
        const response = toDiscussionResponse(discussion);

        expect(response).toBe("d1|ref");
    });

    it("returns formatted response for single comment", () => {
        const comment = makeComment({ userName: "Alice", content: "Hello!" });
        const discussion = makeDiscussion([comment]);

        expect(toDiscussionResponse(discussion)).toBe("d1|ref|(Alice|Hello!)");
    });

    it("returns formatted response for multiple comments", () => {
        const comment1 = makeComment({
            id: "c1",
            userName: "Alice",
            content: "Hello!",
        });
        const comment2 = makeComment({
            id: "c2",
            userName: "Bob",
            content: "Hi!",
        });
        const discussion = makeDiscussion([comment1, comment2]);

        expect(toDiscussionResponse(discussion)).toBe(
            "d1|ref|(Alice|Hello!,Bob|Hi!)"
        );
    });

    it("escapes content with commas and quotes", () => {
        const comment = makeComment({
            userName: "Alice",
            content: 'Hello, "world"!',
        });
        const comment2 = makeComment({
            userName: "Bob",
            content: "Hi Alice!",
        });
        const discussion = makeDiscussion([comment, comment2]);
        expect(toDiscussionResponse(discussion)).toBe(
            'd1|ref|(Alice|"Hello, ""world""!",Bob|Hi Alice!)'
        );
    });

    it("escapes content with commas", () => {
        const comment = makeComment({
            userName: "Alice",
            content: "Hello, world!",
        });

        const discussion = makeDiscussion([comment]);
        expect(toDiscussionResponse(discussion)).toBe(
            'd1|ref|(Alice|"Hello, world!")'
        );
    });

    it("returns correct response for discussion with id, reference, and no comments", () => {
        const discussion = makeDiscussion([]);
        expect(toDiscussionResponse(discussion)).toBe("d1|ref");
    });
});
