import { AuthService } from "../../auth/auth-service";
import logger from "../../logger/logger";
import { ResponseBuilder } from "../response-builder";
import { Message, MessageHandler } from "../types";

export class SignInHandler implements MessageHandler {
    constructor(private authService: AuthService) {}

    // Payload should contain [clientName]
    handle(msg: Message, payload: string[]): string {
        if (!payload.length) {
            logger.warn("No client name provided for sign-in", {
                clientId: msg.clientId,
            });

            throw new Error("No client name provided");
        }

        this.authService.signIn(msg.clientId, payload[0]);

        return new ResponseBuilder().with(msg.requestId).build();
    }
}
