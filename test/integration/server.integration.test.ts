import * as net from "net";
import { createServer } from "../../src/server";
import {
    afterAll,
    beforeEach,
    afterEach,
    describe,
    expect,
    test,
} from "vitest";

describe("Server integration tests", () => {
    let server: net.Server;
    let client: net.Socket;
    const port = 8080;

    afterAll(() => {
        server.close();
    });

    beforeEach(async () => {
        if (server) {
            server.close();
        }

        server = createServer();
        server.listen(port);
        client = net.createConnection({ port });
        await new Promise((resolve) => client.on("connect", resolve));
    });

    afterEach(() => {
        client.destroy();
    });

    // Test helpers
    const send = (targetClient: net.Socket, message: string) => {
        return new Promise<string>((resolve) => {
            targetClient.once("data", (data) => {
                resolve(data.toString());
            });
            targetClient.write(message);
        });
    };

    const sendMessage = (message: string) => send(client, message);

    const signIn = async (
        targetClient: net.Socket,
        requestId: string,
        username: string
    ) => {
        return send(targetClient, `${requestId}|SIGN_IN|${username}\n`);
    };

    const createDiscussion = async (
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

    const getDiscussion = async (
        targetClient: net.Socket,
        requestId: string,
        discussionId: string
    ) => {
        return send(targetClient, `${requestId}|GET_DISCUSSION|${discussionId}\n`);
    };

    const clearNotifications = (targetClient: net.Socket) => {
        return new Promise<string[]>((resolve) => {
            const messages: string[] = [];
            const timeout = setTimeout(() => resolve(messages), 50);

            const onData = (data: Buffer) => {
                messages.push(data.toString());
                clearTimeout(timeout);
                setTimeout(() => {
                    targetClient.removeListener("data", onData);
                    resolve(messages);
                }, 50);
            };

            targetClient.on("data", onData);
        });
    };

    const waitForDiscussionUpdated = (targetClient: net.Socket, timeoutMs = 200) => {
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

    test("should sign in a user", async () => {
        const response = await signIn(client, "ougmcim", "janedoe");
        expect(response).toBe("ougmcim\n");
    });

    test("should return the current user", async () => {
        await signIn(client, "ougmcim", "janedoe");
        const response = await sendMessage("hijklmn|WHOAMI\n");
        expect(response).toBe("hijklmn|janedoe\n");
    });

    test("should sign out a user", async () => {
        await signIn(client, "ougmcim", "janedoe");
        const response = await sendMessage("hijklmn|SIGN_OUT\n");
        expect(response).toBe("hijklmn\n");
    });

    test("should create a discussion", async () => {
        // arrange
        await signIn(client, "ougmcim", "janedoe");
        const discussionId = await createDiscussion(
            client,
            "ykkngzx",
            "iofetzv.0s",
            `Hey, folks. What do you think of my video? Does it have enough "polish"?`
        );

        // act
        const getDiscussionResponse = await getDiscussion(
            client,
            "opqrstu",
            discussionId
        );

        // assert
        expect(getDiscussionResponse).toBe(
            `opqrstu|${discussionId}|iofetzv.0s|(janedoe|"Hey, folks. What do you think of my video? Does it have enough ""polish""?")\n`
        );
    });

    test("should create a reply", async () => {
        // arrange
        await signIn(client, "abcdefg", "janedoe");
        const discussionId = await createDiscussion(
            client,
            "ykkngzx",
            "iofetzv.0s",
            `Hey, folks. What do you think of my video? Does it have enough "polish"?`
        );

        // act
        const replyResponse = await sendMessage(
            `sqahhfj|CREATE_REPLY|${discussionId}|I think it's great!\n`
        );

        // assert
        expect(replyResponse).toBe("sqahhfj\n");

        const getDiscussionResponse = await getDiscussion(
            client,
            "opqrstu",
            discussionId
        );

        expect(getDiscussionResponse).toBe(
            `opqrstu|${discussionId}|iofetzv.0s|(janedoe|"Hey, folks. What do you think of my video? Does it have enough ""polish""?",janedoe|I think it's great!)\n`
        );
    });

    test("should list discussions by prefix in order of creation", async () => {
        // arrange
        await signIn(client, "abcdefg", "janedoe");
        const discussionId = await createDiscussion(
            client,
            "ykkngzx",
            "iofetzv.0s",
            `Hey, folks. What do you think of my video? Does it have enough "polish"?`
        );

        const discussionId2 = await createDiscussion(
            client,
            "ykkngzx",
            "iofetzv.1m30s",
            `I think it's great!`
        );

        // should not return it
        await sendMessage(
            `ykkngzx|CREATE_DISCUSSION|iofetzvfoo.1m30s|I think it's great!\n`
        );

        // act
        const response = await sendMessage("opqrstu|LIST_DISCUSSIONS|iofetzv");

        // assert
        expect(response).toBe(
            `opqrstu|(${discussionId}|iofetzv.0s|(janedoe|"Hey, folks. What do you think of my video? Does it have enough ""polish""?"),${discussionId2}|iofetzv.1m30s|(janedoe|I think it's great!))\n`
        );
    });

    test("should receive notification when someone replies to a discussion", async () => {
        // arrange - sign in two users
        await sendMessage("abcdefg|SIGN_IN|janedoe\n");

        // Create second client connection
        const client2 = net.createConnection({ port });
        await new Promise((resolve) => client2.on("connect", resolve));

        const sendMessage2 = (message: string) => {
            return new Promise<string>((resolve) => {
                client2.on("data", (data) => {
                    resolve(data.toString());
                });
                client2.write(message);
            });
        };

        await signIn(client2, "hijklmn", "johndoe");

        // Create a discussion as janedoe
        const discussionId = await createDiscussion(
            client,
            "ykkngzx",
            "video1.0s",
            "Hey, what do you think?"
        );

        // Wait a bit for notification processing
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Clear any existing notifications by reading data
        await clearNotifications(client);
        await clearNotifications(client2);

        // act - Reply as johndoe
        const replyPromise = waitForDiscussionUpdated(client);

        await sendMessage2(
            `sqahhfj|CREATE_REPLY|${discussionId}|That's awesome!\n`
        );

        // assert - janedoe should receive notification about the reply
        const notifications = await replyPromise;
        expect(notifications.length).toBe(1);
        expect(notifications[0]).toBe(`DISCUSSION_UPDATED|${discussionId}\n`);

        client2.destroy();
    });

    test("should notify multiple users when they participate in a discussion", async () => {
        // arrange - sign in three users
        await signIn(client, "abcdefg", "janedoe");

        const client2 = net.createConnection({ port });
        await new Promise((resolve) => client2.on("connect", resolve));
        const client3 = net.createConnection({ port });
        await new Promise((resolve) => client3.on("connect", resolve));

        const sendMessage2 = (message: string) => send(client2, message);

        const sendMessage3 = (message: string) => send(client3, message);

        await signIn(client2, "hijklmn", "johndoe");
        await signIn(client3, "opqrstu", "alicedoe");

        // Create a discussion as janedoe
        const discussionId = await createDiscussion(
            client,
            "ykkngzx",
            "video2.0s",
            "Team meeting discussion"
        );

        // johndoe replies
        await sendMessage2(
            `sqahhfj|CREATE_REPLY|${discussionId}|I'll be there\n`
        );

        // Wait for notifications to be processed
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Clear existing notifications
        await clearNotifications(client);
        await clearNotifications(client2);

        // act - alicedoe replies, should notify both janedoe and johndoe
        const notification1Promise = waitForDiscussionUpdated(client);

        const notification2Promise = waitForDiscussionUpdated(client2);

        await sendMessage3(`tuvwxyz|CREATE_REPLY|${discussionId}|Me too!\n`);

        // assert - both users should receive notifications
        const [notifications1, notifications2] = await Promise.all([
            notification1Promise,
            notification2Promise,
        ]);

        expect(notifications1.length).toBe(1);
        expect(notifications1[0]).toBe(`DISCUSSION_UPDATED|${discussionId}\n`);
        expect(notifications2.length).toBe(1);
        expect(notifications2[0]).toBe(`DISCUSSION_UPDATED|${discussionId}\n`);

        client2.destroy();
        client3.destroy();
    });

    test("should notify users when they are mentioned in a comment", async () => {
        // arrange - sign in two users
        await signIn(client, "abcdefg", "janedoe");

        const client2 = net.createConnection({ port });
        await new Promise((resolve) => client2.on("connect", resolve));

        const sendMessage2 = (message: string) => send(client2, message);

        await signIn(client2, "hijklmn", "johndoe");

        // Wait for sign in to complete
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Clear any existing notifications
        await clearNotifications(client);
        await clearNotifications(client2);

        // act - janedoe creates discussion mentioning johndoe
        const notificationPromise = waitForDiscussionUpdated(client2);

        const discussionId = await createDiscussion(
            client,
            "ykkngzx",
            "video3.0s",
            "Hey @johndoe, what do you think about this?"
        );
        await sendMessage(`tuvwxyz|CREATE_REPLY|${discussionId}|Me too!\n`);

        // assert - johndoe should receive notification even though they weren't part of discussion initially
        const notifications = await notificationPromise;
        expect(notifications.length).toBe(1);
        expect(notifications[0]).toBe(`DISCUSSION_UPDATED|${discussionId}\n`);

        client2.destroy();
    });
});
