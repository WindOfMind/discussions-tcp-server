import logger from "../logger/logger";
import { ResponseBuilder } from "../message/response-builder";
import {
    DiscussionUpdatedNotification,
    Notification,
    NotificationType,
} from "./types";

const DEFAULT_LIMIT = 100;

export class NotificationService {
    private userNotifications: Map<string, string[]> = new Map();
    private notificationQueue: number[] = [];
    private notificationMessages: Map<
        number,
        { user: string; message: string }
    > = new Map();

    private clientHandlers: Map<string, (data: string) => void> = new Map();
    private clientIdByUser: Map<string, string> = new Map();
    private formatters: Record<NotificationType, (n: Notification) => string> =
        {
            [NotificationType.DISCUSSION_UPDATED]:
                formatDiscussionUpdatedNotification,
        };

    private id = 1;

    constructor() {}

    notify(users: string[], notification: Notification): void {
        users.forEach((user) => {
            if (!this.userNotifications.has(user)) {
                this.userNotifications.set(user, []);
            }

            const formatter = this.formatters[notification.type];
            if (!formatter) {
                throw new Error(
                    `Formatter for notification type ${notification.type} not found`
                );
            }

            this.notificationMessages.set(this.id, {
                user,
                message: formatter(notification),
            });
            this.notificationQueue.push(this.id);
            this.id++;
        });
    }

    registerClient(clientId: string, handler: (data: string) => void): void {
        this.clientHandlers.set(clientId, handler);
    }

    registerUser(clientId: string, userName: string): void {
        this.clientIdByUser.set(userName, clientId);
    }

    unregisterUser(userName: string): void {
        this.clientIdByUser.delete(userName);
    }

    unregisterClient(clientId: string): void {
        this.clientHandlers.delete(clientId);
    }

    notifyUsers(): void {
        const messages = this.selectMessages();

        messages.forEach((id) => {
            const message = this.notificationMessages.get(id);

            try {
                if (message) {
                    const clientId =
                        this.clientIdByUser.get(message.user) || "";
                    const handler = this.clientHandlers.get(clientId);

                    if (!handler) {
                        logger.warn("Handler for client not found", {
                            clientId,
                        });

                        return;
                    }

                    handler(message.message);
                    this.notificationMessages.delete(id);
                }
            } catch (error) {
                logger.error("Error notifying clients:", {
                    error,
                    user: message?.user,
                });
            }
        });

        this.notificationQueue = this.notificationQueue.filter((id) =>
            messages.includes(id)
        );
    }

    /**
     * Starts periodic notification dispatching
     * @param intervalInMs in milliseconds
     */
    init(intervalInMs = 100) {
        const id = setInterval(() => {
            this.notifyUsers();
        }, intervalInMs);

        return () => clearInterval(id);
    }

    // Take first DEFAULT_LIMIT messages from the queue
    private selectMessages() {
        const messages = this.notificationQueue
            .filter((id) => {
                const user = this.notificationMessages.get(id)?.user || "";
                return (
                    this.notificationMessages.has(id) &&
                    this.clientIdByUser.has(user)
                );
            })
            .slice(0, DEFAULT_LIMIT);

        return messages;
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
