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
});
