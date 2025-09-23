import { AuthService } from "../../auth/auth-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";
import logger from "../../logger/logger";

export class WhoAmIHandler implements MessageHandler {
    constructor(private authService: AuthService) {}

    handle(msg: Message): string {
        const name = this.authService.whoAmI(msg.clientId);

        if (!name) {
            logger.warn("No name found for client ID", {
                clientId: msg.clientId,
            });

            throw new Error("Not signed in");
        }

        // should return in the format: requestId|name
        return new ResponseBuilder().with(msg.requestId).with(name).build();
    }
}
