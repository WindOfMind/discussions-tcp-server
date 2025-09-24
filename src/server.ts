import * as net from "net";
import { AuthService } from "./auth/auth-service";
import { DiscussionService } from "./discussion/discussion-service";
import logger from "./logger/logger";
import { MessageService } from "./message/message-service";
import { NotificationService } from "./notification/notification-service";
import { CreateDiscussionHandler } from "./message/handler/create-discussion-handler";
import { CreateReplyHandler } from "./message/handler/create-reply-handler";
import { GetDiscussionHandler } from "./message/handler/get-discussion-handler";
import { ListDiscussionsHandler } from "./message/handler/list-discussions-handler";
import { SignInHandler } from "./message/handler/signin-handler";
import { SignOutHandler } from "./message/handler/signout-handler";
import { WhoAmIHandler } from "./message/handler/whoami-handler";
import { MessageType } from "./message/types";
import { DiscussionRepository } from "./discussion/discussion-repository";

const DEFAULT_NOTIFICATION_INTERVAL_MS = 100;

export const createServer = (withNotifications = true) => {
    // Repositories
    const discussionRepository = new DiscussionRepository();

    // Services
    const notificationService = new NotificationService();
    const authService = new AuthService(notificationService);
    const discussionService = new DiscussionService(
        notificationService,
        authService,
        discussionRepository
    );
    const messageService = new MessageService(authService);
    messageService.acceptMessage(
        MessageType.SIGN_IN,
        new SignInHandler(authService)
    );
    messageService.acceptMessage(
        MessageType.WHOAMI,
        new WhoAmIHandler(authService)
    );
    messageService.acceptMessage(
        MessageType.SIGN_OUT,
        new SignOutHandler(authService)
    );
    messageService.acceptMessage(
        MessageType.CREATE_DISCUSSION,
        new CreateDiscussionHandler(discussionService)
    );
    messageService.acceptMessage(
        MessageType.CREATE_REPLY,
        new CreateReplyHandler(discussionService)
    );
    messageService.acceptMessage(
        MessageType.GET_DISCUSSION,
        new GetDiscussionHandler(discussionService)
    );
    messageService.acceptMessage(
        MessageType.LIST_DISCUSSIONS,
        new ListDiscussionsHandler(discussionService)
    );
    const notificationStopFn = withNotifications
        ? notificationService.init()
        : null;

    // Server
    const tcpServer = net.createServer((socket: net.Socket) => {
        const clientId = socket.remoteAddress + ":" + socket.remotePort;
        logger.info("Client connected", { clientId });

        notificationService.registerClient(clientId, (message) => {
            socket.write(message);
        });

        socket.on("data", (data: Buffer) => {
            logger.debug("Server received", {
                data: data.toString(),
                clientId,
            });

            try {
                const response = messageService.processMessage(data, clientId);
                logger.debug("Server sending", { response, clientId });
                socket.write(response);
            } catch (error) {
                logger.error("Error processing message", {
                    error,
                    clientId,
                    data: data.toString(),
                });
                socket.write("Error processing message");
            }
        });

        socket.on("end", () => {
            logger.info("Client disconnected", { clientId });
            notificationService.unregisterClient(clientId);
        });
    });

    tcpServer.on("close", () => {
        logger.info("Server closed");

        notificationStopFn?.();
    });

    return tcpServer;
};
