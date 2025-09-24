import { AuthService } from "../auth/auth-service";
import { MessageType, Message, MessageHandler, MessageTypes } from "./types";
import logger from "../logger/logger";

export class MessageService {
    private messageHandlers: { [messageType: string]: MessageHandler } = {};

    constructor(
        private readonly authService: AuthService
    ) {
    }

    acceptMessage(messageType: MessageType, handler: MessageHandler) {
        this.messageHandlers[messageType] = handler;
    }

    processMessage(data: Buffer, clientId: string): string {
        logger.info(`Processing message`, {
            clientId,
        });

        const userName = this.authService.whoAmI(clientId);
        const msg = parseMessage(data, clientId, userName);
        const handler = this.messageHandlers[msg.messageType];

        if (!handler) {
            throw new Error(`Unknown message type: ${msg.messageType}`);
        }

        return handler.handle(msg);
    }
}

const REQUEST_ID_REGEX = /^[a-z]{7}$/;

export function parseMessage(data: Buffer, clientId: string, userName: string | null): Message {
    const message = data.toString().trimEnd();
    const parts = message.split("|");

    if (parts.length < 2) {
        throw new Error("Invalid message format");
    }

    const requestId = parts[0];
    if (!REQUEST_ID_REGEX.test(requestId)) {
        throw new Error("Request ID must be 7 lowercase letters");
    }

    const messageType = parts[1];
    if (!MessageTypes.includes(messageType)) {
        throw new Error(`Unknown action: ${messageType}`);
    }

    return {
        requestId,
        messageType: messageType as MessageType,
        clientId,
        userName,
        payload: parts.slice(2),
    };
}
