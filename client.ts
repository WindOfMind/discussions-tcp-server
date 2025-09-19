import * as net from "net";

// TCP Client
const client = new net.Socket();

client.connect(8083, "localhost", () => {
  console.log("Connected");
  client.write("Hello, server! Love, Client.");
});

client.on("data", (data: Buffer) => {
  console.log("Received: " + data);
  client.destroy(); // kill client after server's response
});

client.on("close", () => {
  console.log("Connection closed");
});
