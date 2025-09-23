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

    const sendMessage = (message: string) => {
        return new Promise<string>((resolve) => {
            client.on("data", (data) => {
                resolve(data.toString());
            });
            client.write(message);
        });
    };

    test("should sign in a user", async () => {
        const response = await sendMessage("ougmcim|SIGN_IN|janedoe\n");
        expect(response).toBe("ougmcim\n");
    });

    test("should return the current user", async () => {
        await sendMessage("ougmcim|SIGN_IN|janedoe\n");
        const response = await sendMessage("hijklmn|WHOAMI\n");
        expect(response).toBe("hijklmn|janedoe\n");
    });

    test("should sign out a user", async () => {
        await sendMessage("ougmcim|SIGN_IN|janedoe\n");
        const response = await sendMessage("hijklmn|SIGN_OUT\n");
        expect(response).toBe("hijklmn\n");
    });

    test("should create a discussion", async () => {
        // arrange
        await sendMessage("ougmcim|SIGN_IN|janedoe\n");
        const response = await sendMessage(
            `ykkngzx|CREATE_DISCUSSION|iofetzv.0s|Hey, folks. What do you think of my video? Does it have enough "polish"?\n`
        );

        const discussionId = response.split("|")[1].trim();

        // act
        const getDiscussionResponse = await sendMessage(
            `opqrstu|GET_DISCUSSION|${discussionId}\n`
        );

        // assert
        expect(getDiscussionResponse).toBe(
            `opqrstu|${discussionId}|iofetzv.0s|(janedoe|"Hey, folks. What do you think of my video? Does it have enough ""polish""?")\n`
        );
    });

    test("should create a reply", async () => {
        // arrange
        await sendMessage("abcdefg|SIGN_IN|janedoe");
        const createResponse = await sendMessage(
            `ykkngzx|CREATE_DISCUSSION|iofetzv.0s|Hey, folks. What do you think of my video? Does it have enough "polish"?`
        );
        const discussionId = createResponse.split("|")[1].trim();

        // act
        const replyResponse = await sendMessage(
            `sqahhfj|CREATE_REPLY|${discussionId}|I think it's great!\n`
        );

        // assert
        expect(replyResponse).toBe("sqahhfj\n");

        const getDiscussionResponse = await sendMessage(
            `opqrstu|GET_DISCUSSION|${discussionId}\n`
        );

        expect(getDiscussionResponse).toBe(
            `opqrstu|${discussionId}|iofetzv.0s|(janedoe|"Hey, folks. What do you think of my video? Does it have enough ""polish""?",janedoe|I think it's great!)\n`
        );
    });

    //TODO: should return in order as the discussions were created
    test("should list discussions by prefix", async () => {
        // arrange
        await sendMessage("abcdefg|SIGN_IN|janedoe");
        const createResponse = await sendMessage(
            `ykkngzx|CREATE_DISCUSSION|iofetzv.0s|Hey, folks. What do you think of my video? Does it have enough "polish"?\n`
        );
        const discussionId = createResponse.split("|")[1].trim();

        const createResponse2 = await sendMessage(
            `ykkngzx|CREATE_DISCUSSION|iofetzv.1m30s|I think it's great!\n`
        );
        const discussionId2 = createResponse2.split("|")[1].trim();

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

        await sendMessage2("hijklmn|SIGN_IN|johndoe\n");

        // Create a discussion as janedoe
        const createResponse = await sendMessage(
            "ykkngzx|CREATE_DISCUSSION|video1.0s|Hey, what do you think?\n"
        );
        const discussionId = createResponse.split("|")[1].trim();

        // Wait a bit for notification processing
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Clear any existing notifications by reading data
        const clearNotifications = (client: net.Socket) => {
            return new Promise<string[]>((resolve) => {
                const messages: string[] = [];
                const timeout = setTimeout(() => resolve(messages), 50);

                const onData = (data: Buffer) => {
                    messages.push(data.toString());
                    clearTimeout(timeout);
                    setTimeout(() => {
                        client.removeListener("data", onData);
                        resolve(messages);
                    }, 50);
                };

                client.on("data", onData);
            });
        };

        await clearNotifications(client);
        await clearNotifications(client2);

        // act - Reply as johndoe
        const replyPromise = new Promise<string[]>((resolve) => {
            const notifications: string[] = [];
            const timeout = setTimeout(() => resolve(notifications), 200);

            const onData = (data: Buffer) => {
                const message = data.toString();
                if (message.startsWith("DISCUSSION_UPDATED")) {
                    notifications.push(message);
                    clearTimeout(timeout);
                    setTimeout(() => {
                        client.removeListener("data", onData);
                        resolve(notifications);
                    }, 50);
                }
            };

            client.on("data", onData);
        });

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
        await sendMessage("abcdefg|SIGN_IN|janedoe\n");

        const client2 = net.createConnection({ port });
        await new Promise((resolve) => client2.on("connect", resolve));
        const client3 = net.createConnection({ port });
        await new Promise((resolve) => client3.on("connect", resolve));

        const sendMessage2 = (message: string) => {
            return new Promise<string>((resolve) => {
                client2.on("data", (data) => {
                    resolve(data.toString());
                });
                client2.write(message);
            });
        };

        const sendMessage3 = (message: string) => {
            return new Promise<string>((resolve) => {
                client3.on("data", (data) => {
                    resolve(data.toString());
                });
                client3.write(message);
            });
        };

        await sendMessage2("hijklmn|SIGN_IN|johndoe\n");
        await sendMessage3("opqrstu|SIGN_IN|alicedoe\n");

        // Create a discussion as janedoe
        const createResponse = await sendMessage(
            "ykkngzx|CREATE_DISCUSSION|video2.0s|Team meeting discussion\n"
        );
        const discussionId = createResponse.split("|")[1].trim();

        // johndoe replies
        await sendMessage2(
            `sqahhfj|CREATE_REPLY|${discussionId}|I'll be there\n`
        );

        // Wait for notifications to be processed
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Clear existing notifications
        const clearNotifications = (client: net.Socket) => {
            return new Promise<string[]>((resolve) => {
                const messages: string[] = [];
                const timeout = setTimeout(() => resolve(messages), 50);

                const onData = (data: Buffer) => {
                    messages.push(data.toString());
                    clearTimeout(timeout);
                    setTimeout(() => {
                        client.removeListener("data", onData);
                        resolve(messages);
                    }, 50);
                };

                client.on("data", onData);
            });
        };

        await clearNotifications(client);
        await clearNotifications(client2);

        // act - alicedoe replies, should notify both janedoe and johndoe
        const notification1Promise = new Promise<string[]>((resolve) => {
            const notifications: string[] = [];
            const timeout = setTimeout(() => resolve(notifications), 200);

            const onData = (data: Buffer) => {
                const message = data.toString();
                if (message.startsWith("DISCUSSION_UPDATED")) {
                    notifications.push(message);
                    clearTimeout(timeout);
                    setTimeout(() => {
                        client.removeListener("data", onData);
                        resolve(notifications);
                    }, 50);
                }
            };

            client.on("data", onData);
        });

        const notification2Promise = new Promise<string[]>((resolve) => {
            const notifications: string[] = [];
            const timeout = setTimeout(() => resolve(notifications), 200);

            const onData = (data: Buffer) => {
                const message = data.toString();
                if (message.startsWith("DISCUSSION_UPDATED")) {
                    notifications.push(message);
                    clearTimeout(timeout);
                    setTimeout(() => {
                        client2.removeListener("data", onData);
                        resolve(notifications);
                    }, 50);
                }
            };

            client2.on("data", onData);
        });

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
        await sendMessage("abcdefg|SIGN_IN|janedoe\n");

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

        await sendMessage2("hijklmn|SIGN_IN|johndoe\n");

        // Wait for sign in to complete
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Clear any existing notifications
        const clearNotifications = (client: net.Socket) => {
            return new Promise<string[]>((resolve) => {
                const messages: string[] = [];
                const timeout = setTimeout(() => resolve(messages), 50);

                const onData = (data: Buffer) => {
                    messages.push(data.toString());
                    clearTimeout(timeout);
                    setTimeout(() => {
                        client.removeListener("data", onData);
                        resolve(messages);
                    }, 50);
                };

                client.on("data", onData);
            });
        };

        await clearNotifications(client);
        await clearNotifications(client2);

        // act - janedoe creates discussion mentioning johndoe
        const notificationPromise = new Promise<string[]>((resolve) => {
            const notifications: string[] = [];
            const timeout = setTimeout(() => resolve(notifications), 200);

            const onData = (data: Buffer) => {
                const message = data.toString();
                if (message.startsWith("DISCUSSION_UPDATED")) {
                    notifications.push(message);
                    clearTimeout(timeout);
                    setTimeout(() => {
                        client2.removeListener("data", onData);
                        resolve(notifications);
                    }, 50);
                }
            };

            client2.on("data", onData);
        });

        const createResponse = await sendMessage(
            "ykkngzx|CREATE_DISCUSSION|video3.0s|Hey @johndoe, what do you think about this?\n"
        );
        const discussionId = createResponse.split("|")[1].trim();

        // assert - johndoe should receive notification even though they weren't part of discussion initially
        const notifications = await notificationPromise;
        expect(notifications.length).toBe(1);
        expect(notifications[0]).toBe(`DISCUSSION_UPDATED|${discussionId}\n`);

        client2.destroy();
    });
});
