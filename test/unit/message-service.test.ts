import { parseMessage } from "../../src/message/message-service";
import { Actions } from "../../src/message/types";

describe("parseMessage", () => {
    const clientId = "client123";

    it("parses a valid message with payload", () => {
        const requestId = "abcdefg";
        const action = Actions[0];
        const payload = ["foo", "bar"];
        const data = Buffer.from(`${requestId}|${action}|${payload.join("|")}`);

        const result = parseMessage(data, clientId);

        expect(result).toEqual({
            requestId,
            action,
            clientId,
            payload,
        });
    });

    it("parses a valid message with no payload", () => {
        const requestId = "bcdefgh";
        const action = Actions[1];
        const data = Buffer.from(`${requestId}|${action}`);

        const result = parseMessage(data, clientId);

        expect(result).toEqual({
            requestId,
            action,
            clientId,
            payload: [],
        });
    });

    it("throws for invalid message format (missing action)", () => {
        const data = Buffer.from("abcdefg");

        expect(() => parseMessage(data, clientId)).toThrow(
            "Invalid message format"
        );
    });

    it("throws for invalid requestId (not 7 lowercase letters)", () => {
        const data = Buffer.from("abc1234|SIGN_IN");

        expect(() => parseMessage(data, clientId)).toThrow(
            "Request ID must be 7 lowercase letters"
        );
    });

    it("throws for unknown action", () => {
        const data = Buffer.from("abcdefg|UNKNOWN_ACTION");

        expect(() => parseMessage(data, clientId)).toThrow(
            "Unknown action: UNKNOWN_ACTION"
        );
    });
});
