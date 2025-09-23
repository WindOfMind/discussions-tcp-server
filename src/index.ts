import "dotenv/config";
import logger from "./logger/logger";
import { createServer } from "./server";

const tcpServer = createServer();

const port = Number(process.env.PORT) || 8083;
const host = process.env.HOST || "localhost";

tcpServer.listen(port, host, () => {
    logger.info(`Server listening on port ${port}`);
});
