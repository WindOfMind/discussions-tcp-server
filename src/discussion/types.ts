export interface Comment {
    id: string;
    discussionId: string;
    content: string;
    userName: string;
    ts: number;
}

export interface Discussion {
    id: string;
    reference: string;
    commentIds: string[];
    users: Set<string>;
    ts: number;
}

export interface DiscussionWithComments extends Discussion {
    comments: Comment[];
}
