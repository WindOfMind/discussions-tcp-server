import logger from "../logger/logger";
import { ResponseBuilder } from "../message/response-builder";
import {
    DiscussionUpdatedNotification,
    Notification,
    NotificationType,
} from "./types";

export class NotificationService {
    // in real application, use a persistent storage like Redis or a database
    private scheduledNotifications: Map<string, string[]> = new Map();
    private notificationQueue: { user: string; message: string }[] = [];
    private clientHandlers: Map<string, (data: string) => void> = new Map();
    private userClientIds: Map<string, Set<string>> = new Map();

    private formatters: Record<NotificationType, (n: Notification) => string> =
        {
            [NotificationType.DISCUSSION_UPDATED]:
                formatDiscussionUpdatedNotification,
        };

    private shouldStop = false;

    constructor() {}

    scheduleNotification(users: string[], notification: Notification): void {
        logger.info("Scheduling notifications for users", {
            users,
            notification,
        });

        users.forEach((user) => {
            const formatter = this.formatters[notification.type];
            if (!formatter) {
                throw new Error(
                    `Formatter for notification type ${notification.type} not found`
                );
            }

            if (this.userClientIds.has(user)) {
                this.notificationQueue.push({
                    user,
                    message: formatter(notification),
                });
            } else {
                if (!this.scheduledNotifications.has(user)) {
                    this.scheduledNotifications.set(user, []);
                }
                this.scheduledNotifications
                    .get(user)
                    ?.push(formatter(notification));
            }
        });
    }

    registerHandler(clientId: string, handler: (data: string) => void): void {
        this.clientHandlers.set(clientId, handler);
    }

    unregisterHandler(clientId: string): void {
        this.clientHandlers.delete(clientId);
    }

    registerUser(clientId: string, userName: string): void {
        if (!this.userClientIds.has(userName)) {
            this.userClientIds.set(userName, new Set());
        }

        this.userClientIds.get(userName)?.add(clientId);

        // setTimeout to avoid imimediate execution during registration
        setTimeout(() => {
            this.pushScheduledMessages(userName);
        });
    }

    unregisterUser(userName: string, clientId: string): void {
        this.userClientIds.get(userName)?.delete(clientId);
    }

    private pushScheduledMessages(userName: string) {
        const messages = this.scheduledNotifications.get(userName);

        if (messages) {
            messages.forEach((message) => {
                this.notificationQueue.push({
                    user: userName,
                    message,
                });
            });
            this.scheduledNotifications.delete(userName);
        }
    }

    private processQueue(): void {
        const message = this.notificationQueue.shift();
        if (message) {
            logger.info("Sending out a notification", {
                message,
            });

            try {
                const clientIds =
                    this.userClientIds.get(message.user) ?? new Set();

                const handlers = Array.from(clientIds)
                    .map((clientId) => this.clientHandlers.get(clientId))
                    .filter((handler) => handler !== undefined);

                if (handlers.length === 0) {
                    // if user is offline, re-schedule the message for later
                    if (!this.scheduledNotifications.has(message.user)) {
                        this.scheduledNotifications.set(message.user, []);
                    }

                    this.scheduledNotifications
                        .get(message.user)
                        ?.push(message.message);
                } else {
                    // retries are not supported in this implementation
                    handlers.forEach((handler) => handler(message.message));
                }
            } catch (error) {
                logger.error("Error sending notification", {
                    error,
                    user: message.user,
                });
            }
        }

        if (!this.shouldStop) {
            setTimeout(() => {
                this.processQueue();
            });
        }
    }

    /**
     * Starts periodic notification dispatching
     * @returns a function to stop the notification dispatching
     */
    init() {
        setTimeout(() => {
            this.processQueue();
        });

        return () => {
            this.shouldStop = true;
        };
    }
}

function formatDiscussionUpdatedNotification(
    notification: DiscussionUpdatedNotification
): string {
    return new ResponseBuilder()
        .with("DISCUSSION_UPDATED")
        .with(notification.discussionId)
        .build();
}
