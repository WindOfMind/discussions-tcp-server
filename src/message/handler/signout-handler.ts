import { AuthService } from "../../auth/auth-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, SignOutMessage } from "../types";

export class SignOutHandler implements MessageHandler<SignOutMessage> {
    constructor(private authService: AuthService) {}

    handle(msg: SignOutMessage): string {
        this.authService.signOut(msg.clientId);

        return new ResponseBuilder().with(msg.requestId).build();
    }
}
