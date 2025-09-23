export enum NotificationType {
    DISCUSSION_UPDATED = "DISCUSSION_UPDATED",
}

export interface NotificationBase {
    type: NotificationType;
}

export interface DiscussionUpdatedNotification extends NotificationBase {
    type: NotificationType.DISCUSSION_UPDATED;
    discussionId: string;
}

export type Notification = DiscussionUpdatedNotification;
