import { AuthService } from "../auth/auth-service";
import { DiscussionService } from "../discussion/discussion-service";
import { Action, Actions, Message, MessageHandler } from "./types";
import { SignInHandler } from "./handler/signin-handler";
import { WhoAmIHandler } from "./handler/whoami-handler";
import { SignOutHandler } from "./handler/signout-handler";
import { CreateDiscussionHandler } from "./handler/create-discussion-handler";
import { CreateReplyHandler } from "./handler/create-reply-handler";
import { GetDiscussionHandler } from "./handler/get-discussion-handler";
import { ListDiscussionsHandler } from "./handler/list-discussions-handler";
import logger from "../logger/logger";

export class MessageService {
    private messageHandlers: Record<Action, MessageHandler>;

    constructor(
        private readonly discussionService: DiscussionService,
        private readonly authService: AuthService
    ) {
        this.messageHandlers = {
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
    }

    processMessage(data: Buffer, clientId: string): string {
        const msg = parseMessage(data, clientId);

        logger.info(`Processing message: ${msg.action}`, {
            clientId: msg.clientId,
        });

        const handler = this.messageHandlers[msg.action];

        return handler.handle(msg, msg.payload);
    }
}

const requestIdRegex = /^[a-z]{7}$/;

export function parseMessage(data: Buffer, clientId: string): Message {
    const message = data.toString().trimEnd();
    const parts = message.split("|");

    if (parts.length < 2) {
        throw new Error("Invalid message format");
    }

    const requestId = parts[0];
    if (!requestIdRegex.test(requestId)) {
        throw new Error("Request ID must be 7 lowercase letters");
    }

    const action = parts[1];
    if (!Actions.includes(action)) {
        throw new Error(`Unknown action: ${action}`);
    }

    return {
        requestId,
        action: action as Action,
        clientId,
        payload: parts.slice(2),
    };
}
