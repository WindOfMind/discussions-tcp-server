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
            new ResponseBuilder({ withEndLine: false })
                .with(c.userName)
                .with(c.content, true)
                .build()
        ) ?? [];

    return new ResponseBuilder({ withEndLine: false })
        .with(discussion.id)
        .with(discussion.reference)
        .withList(comments)
        .build();
};
