import { AuthService } from "../../auth/auth-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, WhoAmIMessage } from "../types";
import logger from "../../logger/logger";

export class WhoAmIHandler implements MessageHandler<WhoAmIMessage> {
    constructor(private authService: AuthService) {}

    handle(msg: WhoAmIMessage): string {
        const name = this.authService.whoAmI(msg.clientId);

        if (!name) {
            logger.warn("No name found for client ID", {
                clientId: msg.clientId,
            });

            return new ResponseBuilder().with(msg.requestId).build();
        }

        return new ResponseBuilder().with(msg.requestId).with(name).build();
    }
}
