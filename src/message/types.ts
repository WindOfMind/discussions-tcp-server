export enum MessageType {
    SIGN_IN = "SIGN_IN",
    WHOAMI = "WHOAMI",
    SIGN_OUT = "SIGN_OUT",
    CREATE_DISCUSSION = "CREATE_DISCUSSION",
    CREATE_REPLY = "CREATE_REPLY",
    GET_DISCUSSION = "GET_DISCUSSION",
    LIST_DISCUSSIONS = "LIST_DISCUSSIONS",
}

export const MessageTypes = Object.values(MessageType).map(String);

export interface Message {
    requestId: string;
    messageType: MessageType;
    clientId: string;
    userName: string | null;
    payload: string[];
}
export interface MessageHandler {
    handle(message: Message): string;
}
