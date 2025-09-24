import { DiscussionService } from "../../discussion/discussion-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

/**
 * Handler for creating a new discussion.
 * Expects payload to contain [reference, comment].
 * Returns response in the format: requestId|discussionId
 */
export class CreateDiscussionHandler implements MessageHandler {
    constructor(private discussionService: DiscussionService) {}

    handle(msg: Message): string {
        const [reference, comment] = msg.payload;

        if (!reference || !comment) {
            throw new Error("Reference and comment are required");
        }

        if (!msg.userName) {
            throw new Error("Not signed in");
        }

        const id = this.discussionService.create(
            msg.userName,
            reference,
            comment
        );

        return new ResponseBuilder().with(msg.requestId).with(id).build();
    }
}
