import { AuthService } from "../../auth/auth-service";
import { DiscussionService } from "../../discussion/discussion-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

export class CreateDiscussionHandler implements MessageHandler {
    constructor(
        private discussionService: DiscussionService
    ) {}

    handle(msg: Message): string {
        const [reference, comment] = msg.payload;

        if (!reference || !comment) {
            throw new Error("Reference and comment are required");
        }

        if (!msg.userName) {
            throw new Error("Not signed in");
        }

        const id = this.discussionService.create(msg.userName, reference, comment);

        // should return in the format: requestId|discussionId
        return new ResponseBuilder().with(msg.requestId).with(id).build();
    }
}
