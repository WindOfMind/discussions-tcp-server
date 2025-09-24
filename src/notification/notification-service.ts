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
    private clientIdByUser: Map<string, string> = new Map();

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

            if (this.clientIdByUser.has(user)) {
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

    registerClient(clientId: string, handler: (data: string) => void): void {
        this.clientHandlers.set(clientId, handler);
    }

    unregisterClient(clientId: string): void {
        this.clientHandlers.delete(clientId);
    }

    registerUser(clientId: string, userName: string): void {
        this.clientIdByUser.set(userName, clientId);

        // setTimeout to avoid imimediate execution during registration
        setTimeout(() => {
            this.pushScheduledMessages(userName);
        });
    }

    unregisterUser(userName: string): void {
        this.clientIdByUser.delete(userName);
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
                const clientId = this.clientIdByUser.get(message.user) || "";
                const handler = this.clientHandlers.get(clientId);

                if (!handler) {
                    if (!this.scheduledNotifications.has(message.user)) {
                        this.scheduledNotifications.set(message.user, []);
                    }

                    // user is not connected
                    this.scheduledNotifications
                        .get(message.user)
                        ?.push(message.message);
                } else {
                    handler(message.message);
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
