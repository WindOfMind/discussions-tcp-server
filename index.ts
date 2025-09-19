import * as net from "net";
import { processData, processMessage } from "./message-service";

// TCP Server
const tcpServer = net.createServer((socket: net.Socket) => {
  const clientKey = socket.remoteAddress + ":" + socket.remotePort;
  console.log("Client connected: " + clientKey);

  socket.on("data", (data: Buffer) => {
    console.log("Server received: " + data);
    const message = processData(data);
    const response = processMessage(message, clientKey);
    console.log("Server sending: " + response);

    socket.write(response);
  });

  socket.on("end", () => {
    console.log("Client disconnected: " + clientKey);
  });
});

tcpServer.listen(8083, "localhost", () => {
  console.log("Server listening on port 8083");
});
