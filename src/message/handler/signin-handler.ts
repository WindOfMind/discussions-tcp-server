import { AuthService } from "../../auth/auth-service";
import { ResponseBuilder } from "../response-builder";
import { MessageHandler, SignInMessage } from "../types";

export class SignInHandler implements MessageHandler<SignInMessage> {
    constructor(private authService: AuthService) {}

    handle(msg: SignInMessage): string {
        this.authService.signIn(msg.clientId, msg.clientName);

        return new ResponseBuilder().with(msg.requestId).build();
    }
}
