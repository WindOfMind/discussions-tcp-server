import logger from "../logger/logger";

export class AuthService {
    private clientNames: { [clientId: string]: string | null } = {};
    private clientIds: { [clientName: string]: string } = {};

    signIn(clientId: string, name: string): void {
        logger.info("Client signed in", { clientId, name });

        if (this.clientIds[name]) {
            logger.error("Name already taken", {
                name,
                existingClientId: this.clientIds[name],
            });

            throw new Error("Name already taken");
        }

        this.clientNames[clientId] = name;
        this.clientIds[name] = clientId;
    }

    whoAmI(clientId: string): string | null {
        logger.debug("Getting current client name", {
            clientId,
            name: this.clientNames[clientId],
        });

        return this.clientNames[clientId] || null;
    }

    signOut(clientId: string): void {
        logger.info("Client signed out", { clientId });

        this.clientNames[clientId] = null;
    }

    getClientIdByName(name: string): string | null {
        return this.clientIds[name] || null;
    }
}
