import { DiscussionWithComments } from "../../discussion/types";
import { ResponseBuilder } from "../response-builder";

export const toDiscussionResponse = (
    discussion: DiscussionWithComments | null
): string => {
    if (!discussion) {
        return "";
    }

    const comments =
        discussion?.comments.map((c) =>
            new ResponseBuilder().with(c.userName).with(c.content, true).build()
        ) ?? [];

    return new ResponseBuilder().withList(comments).build();
};
