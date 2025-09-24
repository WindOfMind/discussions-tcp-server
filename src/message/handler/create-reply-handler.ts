import { AuthService } from "../../auth/auth-service";
import { DiscussionService } from "../../discussion/discussion-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

/**
 * Handler for creating a reply to an existing discussion.
 * Expects payload to contain [discussionId, comment].
 * Returns response in the format: requestId
 */
export class CreateReplyHandler implements MessageHandler {
    constructor(private discussionService: DiscussionService) {}

    handle(msg: Message): string {
        const [discussionId, comment] = msg.payload;

        if (!discussionId || !comment) {
            throw new Error("Discussion ID and comment are required");
        }

        if (!msg.userName) {
            throw new Error("Not signed in");
        }

        this.discussionService.replyTo(discussionId, msg.userName, comment);

        return new ResponseBuilder().with(msg.requestId).build();
    }
}
