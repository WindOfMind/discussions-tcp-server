import * as net from "net";
import { MessageService } from "./message/message-service";
import logger from "./logger/logger";

const messageService = new MessageService();

const tcpServer = net.createServer((socket: net.Socket) => {
  const clientId = socket.remoteAddress + ":" + socket.remotePort;
  logger.info("Client connected", { clientId });

  socket.on("data", (data: Buffer) => {
    logger.debug("Server received", { data: data.toString(), clientId });
    const response = messageService.processMessage(data, clientId);
    logger.debug("Server sending", { response, clientId });

    socket.write(response);
  });

  socket.on("end", () => {
    logger.info("Client disconnected", { clientId });
  });
});

tcpServer.listen(8083, "localhost", () => {
  logger.info("Server listening on port 8083");
});
