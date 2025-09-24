import { parseMessage } from "../../src/message/message-service";
import { MessageTypes } from "../../src/message/types";

describe("parseMessage", () => {
    const clientId = "client123";

    it("parses a valid message with payload", () => {
        const requestId = "abcdefg";
        const messageType = MessageTypes[0];
        const payload = ["foo", "bar"];
        const userName = "user123";
        const data = Buffer.from(`${requestId}|${messageType}|${payload.join("|")}`);

        const result = parseMessage(data, clientId, userName);

        expect(result).toEqual({
            requestId,
            messageType,
            userName,
            clientId,
            payload,
        });
    });

    it("parses a valid message with no payload", () => {
        const requestId = "bcdefgh";
        const messageType = MessageTypes[1];
        const userName = "user123";
        const data = Buffer.from(`${requestId}|${messageType}`);

        const result = parseMessage(data, clientId, userName);

        expect(result).toEqual({
            requestId,
            messageType,
            userName,
            clientId,
            payload: [],
        });
    });

    it("throws for invalid message format (missing action)", () => {
        const data = Buffer.from("abcdefg");

        expect(() => parseMessage(data, clientId, null)).toThrow(
            "Invalid message format"
        );
    });

    it("throws for invalid requestId (not 7 lowercase letters)", () => {
        const data = Buffer.from("abc1234|SIGN_IN");

        expect(() => parseMessage(data, clientId, null)).toThrow(
            "Request ID must be 7 lowercase letters"
        );
    });

    it("throws for unknown action", () => {
        const data = Buffer.from("abcdefg|UNKNOWN_ACTION");

        expect(() => parseMessage(data, clientId, null)).toThrow(
            "Unknown action: UNKNOWN_ACTION"
        );
    });
});
