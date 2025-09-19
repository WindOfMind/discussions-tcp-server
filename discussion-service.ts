import { v4 as uuidv4 } from "uuid";

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
  comments: Comment[];
  ts: number;
}

export class DiscussionService {
  private discussions: {
    [id: string]: Discussion;
  } = {};

  private comments: {
    [id: string]: Comment;
  } = {};

  create(
    clientName: string,
    reference: string,
    commentContent: string
  ): string {
    const id = uuidv4();

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
      comments: [comment],
      ts: Date.now(),
    };

    return id;
  }

  replyTo(discussionId: string, clientName: string, content: string): boolean {
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
      discussion.comments.push(reply);

      return true;
    }

    return false;
  }

  get(discussionId: string): Discussion | null {
    return this.discussions[discussionId] || null;
  }

  list(referencePrefix: string): Discussion[] {
    return Object.values(this.discussions)
      .filter((d) => {
        const parts = d.reference.split(".");

        return parts[0] === referencePrefix || d.reference === referencePrefix;
      })
      .sort((a, b) => a.ts - b.ts);
  }
}
