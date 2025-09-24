import logger from "../logger/logger";
import { DiscussionWithComments } from "./types";
import { NotificationService } from "../notification/notification-service";
import { NotificationType } from "../notification/types";
import { COMMENT_USER_NAME_REGEX } from "../auth/user";
import { AuthService } from "../auth/auth-service";
import { DiscussionRepository } from "./discussion-repository";

const REFERENCE_REGEX = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;

export class DiscussionService {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly authService: AuthService,
        private readonly discussionRepository: DiscussionRepository
    ) {}

    create(user: string, reference: string, commentContent: string): string {
        logger.info("Creating discussion", {
            clientName: user,
            reference,
        });

        if (!isValidReference(reference)) {
            throw new Error("Invalid reference format");
        }

        const mentionedUsers = this.getMentionedUsers(commentContent);

        // creating and adding users should be done in one transaction
        const discussionId = this.discussionRepository.create(
            user,
            reference,
            commentContent
        );
        this.discussionRepository.addUsers(discussionId, [
            ...mentionedUsers,
            user,
        ]);

        logger.info("Discussion created", {
            discussionId,
            mentionedUsers,
        });

        return discussionId;
    }

    replyTo(discussionId: string, userName: string, content: string): void {
        logger.info("Replying to discussion", {
            discussionId,
            userName,
        });

        const discussion = this.discussionRepository.get(discussionId);

        if (!discussion) {
            logger.error("Discussion not found", { discussionId });
            throw new Error("Discussion not found");
        }

        const mentionedUsers = this.getMentionedUsers(content);

        // adding comment and adding users should be done in one transaction
        this.discussionRepository.addComment(discussionId, content, userName);
        this.discussionRepository.addUsers(discussionId, [
            ...mentionedUsers,
            userName,
        ]);

        // Though in this particular case, it is reasonable to assume
        // that we don't need to guarantee "at-least-one" notification.
        // If we need to guarantee "at-least-one" notification, we should use the outbox pattern
        this.notificationService.notify(Array.from(discussion.users), {
            type: NotificationType.DISCUSSION_UPDATED,
            discussionId: discussionId,
        });
    }

    get(discussionId: string): DiscussionWithComments | null {
        logger.info("Getting discussion", { discussionId });
        return this.discussionRepository.getWithComments(discussionId);
    }

    /**
     * Lists discussions by reference prefix (e.g. "video1" for "video1.1", "video1.2", etc.)
     * Prefix works only for the whole parts.
     */
    list(referencePrefix: string): DiscussionWithComments[] {
        logger.info("Listing discussions", { referencePrefix });

        return this.discussionRepository.list(referencePrefix);
    }

    private getMentionedUsers(content: string): string[] {
        const mentionedUsers = extractMentionedUsers(content);

        const validMentionedUsers = mentionedUsers.filter((user) =>
            this.authService.isUserExists(user)
        );

        return validMentionedUsers;
    }
}

export const isValidReference = (reference: string): boolean => {
    return REFERENCE_REGEX.test(reference);
};

export const extractMentionedUsers = (content: string): string[] => {
    const mentions = new Set<string>();
    let match;

    while ((match = COMMENT_USER_NAME_REGEX.exec(content)) !== null) {
        mentions.add(match[1]);
    }

    return Array.from(mentions);
};
