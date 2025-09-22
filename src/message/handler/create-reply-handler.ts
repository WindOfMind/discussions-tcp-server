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
        const discussionId = payload[0];
        const comment = payload[1];

        if (!discussionId || !comment) {
            throw new Error("Discussion ID and comment are required");
        }

        const userName = this.authService.whoAmI(msg.clientId);
        if (!userName) {
            throw new Error("Not signed in");
        }

        this.discussionService.replyTo(discussionId, userName, comment);

        // should return in the format: requestId
        return new ResponseBuilder().with(msg.requestId).build();
    }
}
