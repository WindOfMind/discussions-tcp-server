import { v4 as uuidv4 } from "uuid";
import logger from "../logger/logger";
import { Discussion, Comment, DiscussionWithComments } from "./types";
import { NotificationService } from "../notification/notification-service";
import { NotificationType } from "../notification/types";
import { COMMENT_USER_NAME_REGEX } from "../auth/user";
import { AuthService } from "../auth/auth-service";

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

    constructor(
        private readonly notificationService: NotificationService,
        private readonly authService: AuthService
    ) {}

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

        // in the real DB, better to use it as a external ID, not PK
        const discussionId = uuidv4();

        const comment: Comment = {
            id: uuidv4(),
            discussionId: discussionId,
            content: commentContent,
            userName: clientName,
            ts: Date.now(),
        };
        this.comments[comment.id] = comment;

        this.discussions[discussionId] = {
            id: discussionId,
            reference,
            commentIds: [comment.id],
            users: new Set([clientName]),
            ts: Date.now(),
        };

        const referenceStart = reference.split(".")[0];
        this.updateDiscussionIndex(reference, discussionId);
        this.updateDiscussionIndex(referenceStart, discussionId);

        const mentionedUsers = extractMentionedUsers(commentContent);
        mentionedUsers.forEach((user) => {
            if (user && this.authService.isUserExists(user)) {
                this.discussions[discussionId].users.add(user);
            }
        });

        return discussionId;
    }

    private updateDiscussionIndex(reference: string, discussionId: string) {
        if (!this.discussionIndex[reference]) {
            this.discussionIndex[reference] = [];
        }

        this.discussionIndex[reference].push(discussionId);
    }

    replyTo(discussionId: string, userName: string, content: string): void {
        logger.info("Replying to discussion", {
            discussionId,
            userName,
        });

        const discussion = this.discussions[discussionId];

        if (!discussion) {
            logger.error("Discussion not found", { discussionId });

            throw new Error("Discussion not found");
        }

        const reply: Comment = {
            id: uuidv4(),
            discussionId: discussionId,
            content: content,
            userName: userName,
            ts: Date.now(),
        };

        this.comments[reply.id] = reply;
        discussion.commentIds.push(reply.id);

        if (!discussion.users.has(userName)) {
            discussion.users.add(userName);
        }

        const mentionedUsers = extractMentionedUsers(content);
        mentionedUsers.forEach((user) => {
            if (user && this.authService.isUserExists(user)) {
                this.discussions[discussionId].users.add(user);
            }
        });

        this.notificationService.notify(Array.from(discussion.users), {
            type: NotificationType.DISCUSSION_UPDATED,
            discussionId: discussionId,
        });
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

        return (
            discussions
                .map((id) => this.get(id))
                .filter((d): d is DiscussionWithComments => d !== null)
                // TODO: check if we need sorting?
                .sort((a, b) => a.ts - b.ts)
        );
    }
}

export const extractMentionedUsers = (content: string): string[] => {
    const mentions = new Set<string>();
    let match;

    while ((match = COMMENT_USER_NAME_REGEX.exec(content)) !== null) {
        mentions.add(match[1]);
    }

    return Array.from(mentions);
};
