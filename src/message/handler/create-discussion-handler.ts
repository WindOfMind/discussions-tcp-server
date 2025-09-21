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
        const reference = payload[0] || "";
        const comment = payload[1] || "";

        const id = this.discussionService.create(
            this.authService.whoAmI(msg.clientId) || "",
            reference,
            comment
        );

        return new ResponseBuilder().with(msg.requestId).with(id).build();
    }
}
