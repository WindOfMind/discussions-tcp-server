import logger from "./logger/logger";
import { createServer } from "./server";

const tcpServer = createServer();

tcpServer.listen(8083, "localhost", () => {
    logger.info("Server listening on port 8083");
});
