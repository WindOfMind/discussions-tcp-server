import * as net from "net";
import { MessageService } from "./message/message-service";
import logger from "./logger/logger";
import { AuthService } from "./auth/auth-service";
import { DiscussionService } from "./discussion/discussion-service";

const authService = new AuthService();
const discussionService = new DiscussionService();
const messageService = new MessageService(discussionService, authService);

const tcpServer = net.createServer((socket: net.Socket) => {
    const clientId = socket.remoteAddress + ":" + socket.remotePort;
    logger.info("Client connected", { clientId });

    socket.on("data", (data: Buffer) => {
        logger.debug("Server received", { data: data.toString(), clientId });

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
    });
});

tcpServer.listen(8083, "localhost", () => {
    logger.info("Server listening on port 8083");
});
