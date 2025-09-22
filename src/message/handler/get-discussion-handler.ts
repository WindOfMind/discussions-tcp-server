import { DiscussionService } from "../../discussion/discussion-service";
import logger from "../../logger/logger";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";
import { toDiscussionResponse } from "./discussion-utils";

export class GetDiscussionHandler implements MessageHandler {
    constructor(private discussionService: DiscussionService) {}

    handle(msg: Message, payload: string[]): string {
        const discussionId = payload[0];

        if (!discussionId) {
            logger.warn("No discussion ID provided for getting discussion", {
                clientId: msg.clientId,
            });

            return new ResponseBuilder().with(msg.requestId).build();
        }

        const discussion = this.discussionService.get(discussionId);
        const discussionResponse = toDiscussionResponse(discussion);

        return new ResponseBuilder()
            .with(msg.requestId)
            .with(discussionResponse)
            .build();
    }
}
