import { AuthService } from "../auth/auth-service";
import { DiscussionService } from "../discussion/discussion-service";
import { Message, Action, MessageHandler } from "./types";
import { SignInHandler } from "./handler/signin-handler";
import { WhoAmIHandler } from "./handler/whoami-handler";
import { SignOutHandler } from "./handler/signout-handler";
import { CreateDiscussionHandler } from "./handler/create-discussion-handler";
import { CreateReplyHandler } from "./handler/create-reply-handler";
import { GetDiscussionHandler } from "./handler/get-discussion-handler";
import { ListDiscussionsHandler } from "./handler/list-discussions-handler";

export class MessageService {
    private authService = new AuthService();
    private discussionService = new DiscussionService();
    private messageHandlers: Record<Action, MessageHandler> = {
        [Action.SIGN_IN]: new SignInHandler(this.authService),
        [Action.WHOAMI]: new WhoAmIHandler(this.authService),
        [Action.SIGN_OUT]: new SignOutHandler(this.authService),
        [Action.CREATE_DISCUSSION]: new CreateDiscussionHandler(
            this.authService,
            this.discussionService
        ),
        [Action.CREATE_REPLY]: new CreateReplyHandler(
            this.authService,
            this.discussionService
        ),
        [Action.GET_DISCUSSION]: new GetDiscussionHandler(
            this.discussionService
        ),
        [Action.LIST_DISCUSSIONS]: new ListDiscussionsHandler(
            this.discussionService
        ),
    };

    processMessage(data: Buffer, clientId: string): string {
        const msg = this.parseMessage(data, clientId);
        const handler = this.messageHandlers[msg.action];
        return handler.handle(msg);
    }

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
}
