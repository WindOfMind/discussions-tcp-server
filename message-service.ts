import { AuthService } from "./auth-service";
import { Discussion, DiscussionService } from "./discussion-service";

export enum Action {
  SIGN_IN = "SIGN_IN",
  WHOAMI = "WHOAMI",
  SIGN_OUT = "SIGN_OUT",
  CREATE_DISCUSSION = "CREATE_DISCUSSION",
  CREATE_REPLY = "CREATE_REPLY",
  GET_DISCUSSION = "GET_DISCUSSION",
  LIST_DISCUSSIONS = "LIST_DISCUSSIONS",
}

export interface MessageBase {
  requestId: string;
  action: Action;
  clientId: string;
}

export interface SignInMessage extends MessageBase {
  action: Action.SIGN_IN;
  clientName: string;
}

export interface SignOutMessage extends MessageBase {
  action: Action.SIGN_OUT;
}

export interface WhoAmIMessage extends MessageBase {
  action: Action.WHOAMI;
}

export interface CreateDiscussionMessage extends MessageBase {
  action: Action.CREATE_DISCUSSION;
  reference: string;
  comment: string;
}

export interface CreateReplyMessage extends MessageBase {
  action: Action.CREATE_REPLY;
  discussionId: string;
  comment: string;
}

export interface GetDiscussionMessage extends MessageBase {
  action: Action.GET_DISCUSSION;
  discussionId: string;
}

export interface ListDiscussionsMessage extends MessageBase {
  action: Action.LIST_DISCUSSIONS;
  referencePrefix: string;
}

export type Message =
  | SignInMessage
  | SignOutMessage
  | WhoAmIMessage
  | CreateDiscussionMessage
  | CreateReplyMessage
  | GetDiscussionMessage
  | ListDiscussionsMessage;

export class MessageService {
  private authService = new AuthService();
  private discussionService = new DiscussionService();

  private parseMessage(data: Buffer, clientId: string): Message {
    const message = data.toString().trimEnd();
    const parts = message.split("|");
    const requestId = parts[0];
    const action = parts[1] as Action;

    switch (action) {
      case Action.SIGN_IN:
        return {
          requestId,
          action,
          clientId,
          clientName: parts[2] || "",
        };

      case Action.WHOAMI:
      case Action.SIGN_OUT:
        return { requestId, action, clientId };

      case Action.CREATE_DISCUSSION:
        return {
          requestId,
          action,
          clientId,
          reference: parts[2] || "",
          comment: parts[3] || "",
        };

      case Action.CREATE_REPLY:
        return {
          requestId,
          action,
          clientId,
          discussionId: parts[2] || "",
          comment: parts[3] || "",
        };

      case Action.GET_DISCUSSION:
        return {
          requestId,
          action,
          clientId,
          discussionId: parts[2] || "",
        };

      case Action.LIST_DISCUSSIONS:
        return {
          requestId,
          action,
          clientId,
          referencePrefix: parts[2] || "",
        };
    }
  }

  processMessage(data: Buffer, clientId: string): string {
    const msg = this.parseMessage(data, clientId);

    switch (msg.action) {
      case Action.SIGN_IN:
        this.authService.signIn(msg.clientId, msg.clientName);

        return msg.requestId + "\n";

      case Action.WHOAMI:
        const name = this.authService.whoAmI(msg.clientId);

        return [msg.requestId, name].join("|") + "\n";

      case Action.SIGN_OUT:
        this.authService.signOut(msg.clientId);

        return msg.requestId + "\n";

      case Action.CREATE_DISCUSSION:
        const id = this.discussionService.create(
          this.authService.whoAmI(msg.clientId) || "",
          msg.reference,
          msg.comment
        );

        return msg.requestId + "|" + id + "\n";

      case Action.CREATE_REPLY:
        this.discussionService.replyTo(
          msg.discussionId,
          this.authService.whoAmI(msg.clientId) || "",
          msg.comment
        );

        return msg.requestId + "\n";

      case Action.GET_DISCUSSION:
        const discussion = this.discussionService.get(msg.discussionId);
        return (
          [msg.requestId, this.createDiscussionResponse(discussion)].join("|") +
          "\n"
        );

      case Action.LIST_DISCUSSIONS:
        const discussions = this.discussionService.list(msg.referencePrefix);
        const discussionsJoined = discussions
          .map((d) => this.createDiscussionResponse(d))
          .join(",");

        return msg.requestId + "|" + `(${discussionsJoined})\n`;
    }
  }

  private createDiscussionResponse(discussion: Discussion | null): string {
    if (!discussion) {
      return "";
    }

    const commentsJoined = discussion.comments
      .map((comment) => `${comment.clientName}|${escape(comment.content)}`)
      .join(",");

    return [discussion.id, discussion.reference, `(${commentsJoined})`].join(
      "|"
    );
  }
}

const escape = (str: string): string => {
  const escaped = str.replace('"', '""');

  if (escaped.includes(",")) {
    return `"${escaped}"`;
  }

  return escaped;
};
