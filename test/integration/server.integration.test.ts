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
import {
    signIn,
    sendMessage,
    createDiscussion,
    getDiscussion,
    waitForDiscussionUpdated,
} from "./helpers";

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

    test("should sign in a user", async () => {
        const response = await signIn(client, "ougmcim", "janedoe");
        expect(response).toBe("ougmcim\n");
    });

    test("should return the current user", async () => {
        await signIn(client, "ougmcim", "janedoe");
        const response = await sendMessage(client, "hijklmn|WHOAMI\n");
        expect(response).toBe("hijklmn|janedoe\n");
    });

    test("should sign out a user", async () => {
        await signIn(client, "ougmcim", "janedoe");
        const response = await sendMessage(client, "hijklmn|SIGN_OUT\n");
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
            client,
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
            client,
            `ykkngzx|CREATE_DISCUSSION|iofetzvfoo.1m30s|I think it's great!\n`
        );

        // act
        const response = await sendMessage(
            client,
            "opqrstu|LIST_DISCUSSIONS|iofetzv"
        );

        // assert
        expect(response).toBe(
            `opqrstu|(${discussionId}|iofetzv.0s|(janedoe|"Hey, folks. What do you think of my video? Does it have enough ""polish""?"),${discussionId2}|iofetzv.1m30s|(janedoe|I think it's great!))\n`
        );
    });

    test("should receive notification when someone replies to a discussion", async () => {
        // arrange - sign in two users
        await sendMessage(client, "abcdefg|SIGN_IN|janedoe\n");

        // Create second client connection
        const client2 = net.createConnection({ port });
        await new Promise((resolve) => client2.on("connect", resolve));
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

        // act - Reply as johndoe
        const replyPromise = waitForDiscussionUpdated(client);
        const replyPromise2 = waitForDiscussionUpdated(client2);

        await sendMessage(
            client2,
            `sqahhfj|CREATE_REPLY|${discussionId}|That's awesome!\n`
        );

        // assert - janedoe should receive notification about the reply
        const notification = await replyPromise;
        expect(notification).toBe(`DISCUSSION_UPDATED|${discussionId}\n`);

        const notification2 = await replyPromise2;
        expect(notification2).toBe(`DISCUSSION_UPDATED|${discussionId}\n`);

        client2.destroy();
    });

    test("should notify users when they are mentioned in a comment", async () => {
        // arrange - sign in two users
        await signIn(client, "abcdefg", "janedoe");

        const client2 = net.createConnection({ port });
        await new Promise((resolve) => client2.on("connect", resolve));
        await signIn(client2, "hijklmn", "johndoe");

        // act - janedoe creates discussion mentioning johndoe
        const notificationPromise = waitForDiscussionUpdated(client);
        const notificationPromise2 = waitForDiscussionUpdated(client2);

        const discussionId = await createDiscussion(
            client,
            "ykkngzx",
            "video3.0s",
            "Hey @johndoe, what do you think about this?"
        );
        await sendMessage(
            client,
            `tuvwxyz|CREATE_REPLY|${discussionId}|Me too!\n`
        );

        // assert - johndoe should receive notification even though they weren't part of discussion initially
        const notification = await notificationPromise;
        expect(notification).toBe(`DISCUSSION_UPDATED|${discussionId}\n`);

        const notification2 = await notificationPromise2;
        expect(notification2).toBe(`DISCUSSION_UPDATED|${discussionId}\n`);

        client2.destroy();
    });
});
