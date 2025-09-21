import { AuthService } from "../../auth/auth-service";
import { DiscussionService } from "../../discussion/discussion-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, CreateReplyMessage } from "../types";

export class CreateReplyHandler implements MessageHandler<CreateReplyMessage> {
    constructor(
        private authService: AuthService,
        private discussionService: DiscussionService
    ) {}

    handle(msg: CreateReplyMessage): string {
        this.discussionService.replyTo(
            msg.discussionId,
            this.authService.whoAmI(msg.clientId) || "",
            msg.comment
        );

        return new ResponseBuilder().with(msg.requestId).build();
    }
}
