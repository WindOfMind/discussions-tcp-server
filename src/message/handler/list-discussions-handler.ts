import {
    DiscussionService,
    Discussion,
} from "../../discussion/discussion-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

export class ListDiscussionsHandler implements MessageHandler {
    constructor(private discussionService: DiscussionService) {}

    handle(msg: Message, payload: string[]): string {
        const referencePrefix = payload[0] || "";
        const discussions = this.discussionService.list(referencePrefix);
        const discussionsJoined = discussions.map(this.toDiscussionResponse);

        return new ResponseBuilder()
            .with(msg.requestId)
            .withList(discussionsJoined)
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
