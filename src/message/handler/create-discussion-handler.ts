import { AuthService } from "../../auth/auth-service";
import { DiscussionService } from "../../discussion/discussion-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

export class CreateDiscussionHandler implements MessageHandler {
    constructor(
        private authService: AuthService,
        private discussionService: DiscussionService
    ) {}

    handle(msg: Message, payload: string[]): string {
        const reference = payload[0];
        const comment = payload[1];

        if (!reference || !comment) {
            throw new Error("Reference and comment are required");
        }

        const userName = this.authService.whoAmI(msg.clientId);
        if (!userName) {
            throw new Error("Not signed in");
        }

        const id = this.discussionService.create(userName, reference, comment);

        return new ResponseBuilder().with(msg.requestId).with(id).build();
    }
}
