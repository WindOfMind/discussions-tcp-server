import { AuthService } from "../auth/auth-service";
import {
  Discussion,
  DiscussionService,
} from "../discussion/discussion-service";
import { ResponseBuilder } from "./response-builder";
import { Message, Action } from "./types";

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

        return new ResponseBuilder().with(msg.requestId).build();

      case Action.WHOAMI:
        const name = this.authService.whoAmI(msg.clientId);

        if (!name) {
          console.log("No name found for client ID: " + msg.clientId);

          return new ResponseBuilder().with(msg.requestId).build();
        }

        return new ResponseBuilder().with(msg.requestId).with(name).build();

      case Action.SIGN_OUT:
        this.authService.signOut(msg.clientId);

        return new ResponseBuilder().with(msg.requestId).build();

      case Action.CREATE_DISCUSSION:
        const id = this.discussionService.create(
          this.authService.whoAmI(msg.clientId) || "",
          msg.reference,
          msg.comment
        );

        return new ResponseBuilder().with(msg.requestId).with(id).build();

      case Action.CREATE_REPLY:
        this.discussionService.replyTo(
          msg.discussionId,
          this.authService.whoAmI(msg.clientId) || "",
          msg.comment
        );

        return new ResponseBuilder().with(msg.requestId).build();

      case Action.GET_DISCUSSION:
        const discussion = this.discussionService.get(msg.discussionId);
        const disscussionResponse = this.toDiscussionResponse(discussion);

        return new ResponseBuilder()
          .with(msg.requestId)
          .with(disscussionResponse)
          .build();

      case Action.LIST_DISCUSSIONS:
        const discussions = this.discussionService.list(msg.referencePrefix);
        const discussionsJoined = discussions.map(this.toDiscussionResponse);

        return new ResponseBuilder()
          .with(msg.requestId)
          .withList(discussionsJoined)
          .build();
    }
  }

  private toDiscussionResponse(discussion: Discussion | null): string {
    if (!discussion) {
      return "";
    }

    const comments =
      discussion?.comments.map((c) =>
        new ResponseBuilder().with(c.clientName).with(c.content, true).build()
      ) ?? [];

    return new ResponseBuilder().withList(comments).build();
  }
}
