import { AuthService } from "../../auth/auth-service";
import { DiscussionService } from "../../discussion/discussion-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

export class CreateReplyHandler implements MessageHandler {
    constructor(
        private authService: AuthService,
        private discussionService: DiscussionService
    ) {}

    handle(msg: Message, payload: string[]): string {
        const discussionId = payload[0] || "";
        const comment = payload[1] || "";

        this.discussionService.replyTo(
            discussionId,
            this.authService.whoAmI(msg.clientId) || "",
            comment
        );

        return new ResponseBuilder().with(msg.requestId).build();
    }
}
