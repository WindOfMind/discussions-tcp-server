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
    videoTimestamp: string,
    text: string
) => {
    const response = await send(
        targetClient,
        `${requestId}|CREATE_DISCUSSION|${videoTimestamp}|${text}\n`
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
    return new Promise<string[]>((resolve) => {
        const notifications: string[] = [];
        const timeout = setTimeout(() => resolve(notifications), timeoutMs);

        const onData = (data: Buffer) => {
            const message = data.toString();
            if (message.startsWith("DISCUSSION_UPDATED")) {
                notifications.push(message);
                clearTimeout(timeout);
                setTimeout(() => {
                    targetClient.removeListener("data", onData);
                    resolve(notifications);
                }, 50);
            }
        };

        targetClient.on("data", onData);
    });
};
