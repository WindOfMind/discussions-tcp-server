export interface Comment {
    id: string;
    discussionId: string;
    content: string;
    clientName: string;
    ts: number;
}

export interface Discussion {
    id: string;
    reference: string;
    referenceStart: string;
    commentIds: string[];
    ts: number;
}

export interface DiscussionWithComments extends Discussion {
    comments: Comment[];
}
