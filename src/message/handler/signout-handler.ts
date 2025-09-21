import { AuthService } from "../../auth/auth-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, Message } from "../types";

export class SignOutHandler implements MessageHandler {
    constructor(private authService: AuthService) {}

    handle(msg: Message, payload: string[]): string {
        this.authService.signOut(msg.clientId);

        return new ResponseBuilder().with(msg.requestId).build();
    }
}
