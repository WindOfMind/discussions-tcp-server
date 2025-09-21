import { AuthService } from "../../auth/auth-service";
import { DiscussionService } from "../../discussion/discussion-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, CreateDiscussionMessage } from "../types";

export class CreateDiscussionHandler
    implements MessageHandler<CreateDiscussionMessage>
{
    constructor(
        private authService: AuthService,
        private discussionService: DiscussionService
    ) {}

    handle(msg: CreateDiscussionMessage): string {
        const id = this.discussionService.create(
            this.authService.whoAmI(msg.clientId) || "",
            msg.reference,
            msg.comment
        );

        return new ResponseBuilder().with(msg.requestId).with(id).build();
    }
}
