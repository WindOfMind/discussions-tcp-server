import { DiscussionService } from "../../discussion/discussion-service";
import { DiscussionWithComments } from "../../discussion/types";
import logger from "../../logger/logger";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

export class ListDiscussionsHandler implements MessageHandler {
    constructor(private discussionService: DiscussionService) {}

    handle(msg: Message, payload: string[]): string {
        const referencePrefix = payload[0];

        if (!referencePrefix) {
            logger.warn(
                "No reference prefix provided for listing discussions",
                {
                    clientId: msg.clientId,
                }
            );

            return new ResponseBuilder().with(msg.requestId).build();
        }

        const discussions = this.discussionService.list(referencePrefix);
        const discussionsResponses = discussions.map(this.toDiscussionResponse);

        return new ResponseBuilder()
            .with(msg.requestId)
            .withList(discussionsResponses)
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
