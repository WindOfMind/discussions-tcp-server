import * as net from "net";
import { MessageService } from "./message-service";

const messageService = new MessageService();

// TCP Server
const tcpServer = net.createServer((socket: net.Socket) => {
  const clientId = socket.remoteAddress + ":" + socket.remotePort;
  console.log("Client connected: " + clientId);

  socket.on("data", (data: Buffer) => {
    console.log("Server received: " + data);
    const response = messageService.processMessage(data, clientId);
    console.log("Server sending: " + response);

    socket.write(response);
  });

  socket.on("end", () => {
    console.log("Client disconnected: " + clientId);
  });
});

tcpServer.listen(8083, "localhost", () => {
  console.log("Server listening on port 8083");
});
