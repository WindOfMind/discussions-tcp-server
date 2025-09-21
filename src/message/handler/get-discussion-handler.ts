import {
    DiscussionService,
    Discussion,
} from "../../discussion/discussion-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, GetDiscussionMessage } from "../types";

export class GetDiscussionHandler
    implements MessageHandler<GetDiscussionMessage>
{
    constructor(private discussionService: DiscussionService) {}

    handle(msg: GetDiscussionMessage): string {
        const discussion = this.discussionService.get(msg.discussionId);
        const discussionResponse = this.toDiscussionResponse(discussion);

        return new ResponseBuilder()
            .with(msg.requestId)
            .with(discussionResponse)
            .build();
    }

    private toDiscussionResponse(discussion: Discussion | null): string {
        if (!discussion) {
            return "";
        }

        const comments =
            discussion?.comments.map((c) =>
                new ResponseBuilder()
                    .with(c.clientName)
                    .with(c.content, true)
                    .build()
            ) ?? [];

        return new ResponseBuilder().withList(comments).build();
    }
}
