import { Discussion, Comment, DiscussionWithComments } from "./types";
import { v4 as uuidv4 } from "uuid";

// This is a mock implementation of the discussion repository.
// In the real DB, we should use a database (e.g. PostgreSQL, MySQL, etc.) with proper transactions and indices.
// Important to support the performance of queries for get discussions by id and list discussions by reference prefix.
// Also, to support the uniqueness of the discussion users.
export class DiscussionRepository {
    private discussions: {
        [id: string]: Discussion;
    } = {};

    private comments: {
        [id: string]: Comment;
    } = {};

    // quick access by reference prefix
    private discussionIndex: {
        [reference: string]: string[];
    } = {};

    create(user: string, reference: string, commentContent: string): string {
        // in the real DB, better to use it as a external ID to preserve the sequence of the PK
        const discussionId = uuidv4();

        const comment: Comment = {
            id: uuidv4(),
            discussionId: discussionId,
            content: commentContent,
            userName: user,
            ts: Date.now(),
        };
        this.comments[comment.id] = comment;

        this.discussions[discussionId] = {
            id: discussionId,
            reference,
            commentIds: [comment.id],
            users: new Set(),
            ts: Date.now(),
        };

        const referenceStart = reference.split(".")[0];
        this.updateDiscussionIndex(reference, discussionId);
        this.updateDiscussionIndex(referenceStart, discussionId);

        return discussionId;
    }

    addUsers(discussionId: string, users: string[]) {
        users.forEach((user) => {
            this.discussions[discussionId].users.add(user);
        });
    }

    addComment(discussionId: string, commentContent: string, userName: string) {
        const comment: Comment = {
            id: uuidv4(),
            discussionId: discussionId,
            content: commentContent,
            userName: userName,
            ts: Date.now(),
        };

        this.comments[comment.id] = comment;
        this.discussions[discussionId].commentIds.push(comment.id);

        return comment.id;
    }

    get(id: string): Discussion | null {
        return this.discussions[id] || null;
    }

    getWithComments(discussionId: string): DiscussionWithComments | null {
        const discussion = this.discussions[discussionId] || null;

        if (!discussion) {
            return null;
        }

        const comments = discussion.commentIds.map((id) => this.comments[id]);

        return {
            ...discussion,
            comments,
        };
    }

    /**
     * Lists discussions by reference prefix (e.g. "video1" for "video1.1", "video1.2", etc.)
     * Prefix works only for the whole parts.
     * Returns in the order of creation.
     */
    list(referencePrefix: string): DiscussionWithComments[] {
        const discussions = this.discussionIndex[referencePrefix] || [];

        return discussions
            .map((id) => this.getWithComments(id))
            .filter((d): d is DiscussionWithComments => d !== null);
    }

    private updateDiscussionIndex(reference: string, discussionId: string) {
        if (!this.discussionIndex[reference]) {
            this.discussionIndex[reference] = [];
        }

        this.discussionIndex[reference].push(discussionId);
    }
}
