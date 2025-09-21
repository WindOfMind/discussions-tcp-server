export enum Action {
  SIGN_IN = "SIGN_IN",
  WHOAMI = "WHOAMI",
  SIGN_OUT = "SIGN_OUT",
  CREATE_DISCUSSION = "CREATE_DISCUSSION",
  CREATE_REPLY = "CREATE_REPLY",
  GET_DISCUSSION = "GET_DISCUSSION",
  LIST_DISCUSSIONS = "LIST_DISCUSSIONS",
}

export interface MessageBase {
  requestId: string;
  action: Action;
  clientId: string;
}

export interface SignInMessage extends MessageBase {
  action: Action.SIGN_IN;
  clientName: string;
}

export interface SignOutMessage extends MessageBase {
  action: Action.SIGN_OUT;
}

export interface WhoAmIMessage extends MessageBase {
  action: Action.WHOAMI;
}

export interface CreateDiscussionMessage extends MessageBase {
  action: Action.CREATE_DISCUSSION;
  reference: string;
  comment: string;
}

export interface CreateReplyMessage extends MessageBase {
  action: Action.CREATE_REPLY;
  discussionId: string;
  comment: string;
}

export interface GetDiscussionMessage extends MessageBase {
  action: Action.GET_DISCUSSION;
  discussionId: string;
}

export interface ListDiscussionsMessage extends MessageBase {
  action: Action.LIST_DISCUSSIONS;
  referencePrefix: string;
}

export type Message =
  | SignInMessage
  | SignOutMessage
  | WhoAmIMessage
  | CreateDiscussionMessage
  | CreateReplyMessage
  | GetDiscussionMessage
  | ListDiscussionsMessage;
