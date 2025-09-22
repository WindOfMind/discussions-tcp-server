import { v4 as uuidv4 } from "uuid";
import logger from "../logger/logger";
import { Discussion, Comment, DiscussionWithComments } from "./types";

export class DiscussionService {
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

    create(
        clientName: string,
        reference: string,
        commentContent: string
    ): string {
        logger.info("Creating discussion", {
            clientName,
            reference,
        });

        if (!reference.includes(".")) {
            throw new Error("Invalid reference format");
        }

        // in the real DB, better to use it as a external ID
        const id = uuidv4();
        const referenceStart = reference.split(".")[0];

        const comment = {
            id: uuidv4(),
            discussionId: id,
            content: commentContent,
            clientName: clientName,
            ts: Date.now(),
        };

        this.comments[comment.id] = comment;
        this.discussions[id] = {
            id,
            reference,
            referenceStart,
            commentIds: [comment.id],
            ts: Date.now(),
        };

        this.updateDiscussionIndex(reference, id);
        this.updateDiscussionIndex(referenceStart, id);

        return id;
    }

    private updateDiscussionIndex(reference: string, discussionId: string) {
        if (!this.discussionIndex[reference]) {
            this.discussionIndex[reference] = [];
        }

        this.discussionIndex[reference].push(discussionId);
    }

    replyTo(
        discussionId: string,
        clientName: string,
        content: string
    ): boolean {
        logger.info("Replying to discussion", {
            discussionId,
            clientName,
        });

        const discussion = this.discussions[discussionId];

        if (discussion) {
            const reply = {
                id: uuidv4(),
                discussionId: discussionId,
                content: content,
                clientName: clientName,
                ts: Date.now(),
            };

            this.comments[reply.id] = reply;
            discussion.commentIds.push(reply.id);

            return true;
        }

        return false;
    }

    get(discussionId: string): DiscussionWithComments | null {
        logger.info("Getting discussion", { discussionId });

        const discussion = this.discussions[discussionId] || null;

        if (discussion) {
            const comments = discussion.commentIds.map(
                (id) => this.comments[id]
            );

            return {
                ...discussion,
                comments,
            };
        }

        return null;
    }

    /**
     * Lists discussions by reference prefix (e.g. "video1" for "video1.1", "video1.2", etc.)
     * Prefix works only for the whole parts.
     */
    list(referencePrefix: string): DiscussionWithComments[] {
        logger.info("Listing discussions", { referencePrefix });
        const discussions = this.discussionIndex[referencePrefix] || [];

        return discussions
            .map((id) => this.get(id))
            .filter((d): d is DiscussionWithComments => d !== null)
            .sort((a, b) => a.ts - b.ts);
    }
}
