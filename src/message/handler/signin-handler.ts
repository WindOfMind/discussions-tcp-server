import { AuthService } from "../../auth/auth-service";
import logger from "../../logger/logger";
import { ResponseBuilder } from "../response-builder";
import { Message, MessageHandler } from "../types";

/**
 * Handler for signing in a client.
 * Expects payload to contain [userName].
 * Returns response in the format: requestId
 */
export class SignInHandler implements MessageHandler {
    constructor(private authService: AuthService) {}

    handle(msg: Message): string {
        if (!msg.payload.length) {
            logger.warn("No user name provided for sign-in", {
                clientId: msg.clientId,
            });

            throw new Error("No user name provided");
        }

        this.authService.signIn(msg.clientId, msg.payload[0]);

        return new ResponseBuilder().with(msg.requestId).build();
    }
}
