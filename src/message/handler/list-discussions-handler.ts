import { DiscussionService } from "../../discussion/discussion-service";
import logger from "../../logger/logger";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";
import { toDiscussionResponse } from "./discussion-utils";

export class ListDiscussionsHandler implements MessageHandler {
    constructor(private discussionService: DiscussionService) {}

    // Payload should contain [referencePrefix]
    handle(msg: Message): string {
        const referencePrefix = msg.payload[0];

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
        const discussionsResponses = discussions.map(toDiscussionResponse);

        // should return in the format:
        // requestId|(discussionId|reference|(userName|comment,...),(),...)
        return new ResponseBuilder()
            .with(msg.requestId)
            .withList(discussionsResponses)
            .build();
    }
}
