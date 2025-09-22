import { DiscussionService } from "../../discussion/discussion-service";
import { DiscussionWithComments } from "../../discussion/types";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

export class GetDiscussionHandler implements MessageHandler {
    constructor(private discussionService: DiscussionService) {}

    handle(msg: Message, payload: string[]): string {
        const discussionId = payload[0] || "";
        const discussion = this.discussionService.get(discussionId);
        const discussionResponse = this.toDiscussionResponse(discussion);

        return new ResponseBuilder()
            .with(msg.requestId)
            .with(discussionResponse)
            .build();
    }

    private toDiscussionResponse(
        discussion: DiscussionWithComments | null
    ): string {
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
