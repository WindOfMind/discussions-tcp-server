import { AuthService } from "../../auth/auth-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

/**
 * Handler for signing out a client.
 * Expects no payload.
 * Returns response in the format: requestId
 */
export class SignOutHandler implements MessageHandler {
    constructor(private authService: AuthService) {}

    handle(msg: Message): string {
        this.authService.signOut(msg.clientId);

        return new ResponseBuilder().with(msg.requestId).build();
    }
}
