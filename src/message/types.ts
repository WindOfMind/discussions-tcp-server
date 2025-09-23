export enum Action {
    SIGN_IN = "SIGN_IN",
    WHOAMI = "WHOAMI",
    SIGN_OUT = "SIGN_OUT",
    CREATE_DISCUSSION = "CREATE_DISCUSSION",
    CREATE_REPLY = "CREATE_REPLY",
    GET_DISCUSSION = "GET_DISCUSSION",
    LIST_DISCUSSIONS = "LIST_DISCUSSIONS",
}

export const Actions = Object.values(Action).map(String);

export interface Message {
    requestId: string;
    action: Action;
    clientId: string;
    userName: string | null;
    payload: string[];
}
export interface MessageHandler {
    handle(message: Message): string;
}
