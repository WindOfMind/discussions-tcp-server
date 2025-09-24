import * as net from "net";

export const send = (targetClient: net.Socket, message: string) => {
    return new Promise<string>((resolve) => {
        targetClient.once("data", (data) => {
            resolve(data.toString());
        });
        targetClient.write(message);
    });
};

export const sendMessage = (client: net.Socket, message: string) =>
    send(client, message);

export const signIn = async (
    targetClient: net.Socket,
    requestId: string,
    username: string
) => {
    return send(targetClient, `${requestId}|SIGN_IN|${username}\n`);
};

export const createDiscussion = async (
    targetClient: net.Socket,
    requestId: string,
    ref: string,
    text: string
) => {
    const response = await send(
        targetClient,
        `${requestId}|CREATE_DISCUSSION|${ref}|${text}\n`
    );
    return response.split("|")[1].trim();
};

export const getDiscussion = async (
    targetClient: net.Socket,
    requestId: string,
    discussionId: string
) => {
    return send(targetClient, `${requestId}|GET_DISCUSSION|${discussionId}\n`);
};

export const waitForDiscussionUpdated = (
    targetClient: net.Socket,
    timeoutMs = 200
) => {
    return new Promise<string>((resolve) => {
        let notification: string;
        const timeout = setTimeout(() => resolve(notification), timeoutMs);

        const onData = (data: Buffer) => {
            const message = data.toString();
            if (message.startsWith("DISCUSSION_UPDATED")) {
                notification = message;
                clearTimeout(timeout);
                resolve(notification);
            }
        };

        targetClient.on("data", onData);
    });
};
