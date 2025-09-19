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

let clientNames: { [clientId: string]: string | null } = {};

export const processData = (data: Buffer, clientId: string): Message => {
  const message = data.toString().trimEnd();
  const parts = message.split("|");
  const requestId = parts[0];
  const action = parts[1] as Action;

  switch (action) {
    case Action.SIGN_IN:
      return {
        requestId,
        action,
        clientId,
        clientName: parts[2] || "",
      };

    case Action.WHOAMI:
    case Action.SIGN_OUT:
      return { requestId, action, clientId };

    case Action.CREATE_DISCUSSION:
      return {
        requestId,
        action,
        clientId,
        reference: parts[2] || "",
        comment: parts[3] || "",
      };

    case Action.CREATE_REPLY:
      return {
        requestId,
        action,
        clientId,
        discussionId: parts[2] || "",
        comment: parts[3] || "",
      };

    case Action.GET_DISCUSSION:
      return {
        requestId,
        action,
        clientId,
        discussionId: parts[2] || "",
      };

    case Action.LIST_DISCUSSIONS:
      return {
        requestId,
        action,
        clientId,
        referencePrefix: parts[2] || "",
      };
  }
};

export const processMessage = (msg: Message) => {
  switch (msg.action) {
    case Action.SIGN_IN:
      const signInMsg = msg as SignInMessage;
      clientNames[signInMsg.clientId] = signInMsg.clientName;
      console.log(
        `Client signed in with ID: ${clientNames[signInMsg.clientId]}`
      );
      return msg.requestId + "\n";

    case Action.WHOAMI:
      console.log(`Current client name: ${clientNames[msg.clientId]}`);
      return [msg.requestId, clientNames[msg.clientId]].join("|") + "\n";

    case Action.SIGN_OUT:
      console.log(`Client signed out: ${clientNames[msg.clientId]}`);
      clientNames[msg.clientId] = null;
      return msg.requestId + "\n";

    case Action.CREATE_DISCUSSION:
      const createDiscussionMsg = msg as CreateDiscussionMessage;
      console.log(
        `Creating discussion for reference: ${createDiscussionMsg.reference} with comment: ${createDiscussionMsg.comment}`
      );
      // Here you would normally create the discussion in your system
      return msg.requestId + "|DISCUSSION_CREATED\n";

    case Action.CREATE_REPLY:
      const createReplyMsg = msg as CreateReplyMessage;
      console.log(
        `Creating reply for discussion ID: ${createReplyMsg.discussionId} with comment: ${createReplyMsg.comment}`
      );
      // Here you would normally create the reply in your system
      return msg.requestId + "|REPLY_CREATED\n";

    case Action.GET_DISCUSSION:
      const getDiscussionMsg = msg as GetDiscussionMessage;
      console.log(
        `Fetching discussion with ID: ${getDiscussionMsg.discussionId}`
      );
      // Here you would normally fetch the discussion from your system
      return msg.requestId + "|DISCUSSION_FETCHED\n";

    case Action.LIST_DISCUSSIONS:
      const listDiscussionsMsg = msg as ListDiscussionsMessage;
      console.log(
        `Listing discussions with reference prefix: ${listDiscussionsMsg.referencePrefix}`
      );
      // Here you would normally fetch the discussions from your system
      return msg.requestId + "|DISCUSSIONS_LISTED\n";
  }
};
