import * as net from "net";
import { AuthService } from "./auth/auth-service";
import { DiscussionService } from "./discussion/discussion-service";
import logger from "./logger/logger";
import { MessageService } from "./message/message-service";
import { NotificationService } from "./notification/notification-service";

export const createServer = () => {
    const notificationService = new NotificationService();
    const authService = new AuthService(notificationService);
    const discussionService = new DiscussionService(
        notificationService,
        authService
    );
    const messageService = new MessageService(discussionService, authService);

    notificationService.init(100);

    const tcpServer = net.createServer((socket: net.Socket) => {
        const clientId = socket.remoteAddress + ":" + socket.remotePort;
        logger.info("Client connected", { clientId });

        notificationService.registerListener(clientId, (message) => {
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
                logger.error("Error processing message", { error, clientId });

                socket.write("Error processing message");
            }
        });

        socket.on("end", () => {
            logger.info("Client disconnected", { clientId });
            notificationService.unregisterListener(clientId);
        });
    });

    return tcpServer;
};
