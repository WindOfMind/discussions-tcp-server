import logger from "../logger/logger";
import { ResponseBuilder } from "../message/response-builder";
import {
    DiscussionUpdatedNotification,
    Notification,
    NotificationType,
} from "./types";

export class NotificationService {
    private userNotifications: Map<string, Notification[]> = new Map();
    private clientListeners: Map<string, (data: string) => void> = new Map();
    private usersByClientId: Map<string, string> = new Map();
    private formatters: Record<NotificationType, (n: Notification) => string> =
        {
            [NotificationType.DISCUSSION_UPDATED]:
                formatDiscussionUpdatedNotification,
        };

    constructor() {}

    notify(users: string[], notification: Notification): void {
        users.forEach((user) => {
            if (!this.userNotifications.has(user)) {
                this.userNotifications.set(user, []);
            }

            this.userNotifications.get(user)?.push(notification);
        });
    }

    registerClient(clientId: string, callback: (data: string) => void): void {
        this.clientListeners.set(clientId, callback);
    }

    registerUserForClient(clientId: string, userName: string): void {
        this.usersByClientId.set(clientId, userName);
    }

    unregisterUserForClient(clientId: string): void {
        this.usersByClientId.delete(clientId);
    }

    unregisterClient(clientId: string): void {
        this.clientListeners.delete(clientId);
    }

    notifyUsers(): void {
        this.usersByClientId.forEach((userName, clientId) => {
            try {
                const messages = this.userNotifications.get(userName) || [];
                const listener = this.clientListeners.get(clientId);

                if (!listener || messages.length === 0) {
                    return;
                }

                while (messages.length > 0) {
                    const message = messages.shift();
                    if (message) {
                        const formatter = this.formatters[message.type];
                        if (formatter) {
                            listener(formatter(message));
                        }
                    }
                }
            } catch (error) {
                logger.error("Error notifying clients:", error);
            }
        });
    }

    /**
     * Starts periodic notification dispatching
     * @param interval in milliseconds
     */
    init(interval = 100) {
        const id = setInterval(() => {
            this.notifyUsers();
        }, interval);

        return () => clearInterval(id);
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
