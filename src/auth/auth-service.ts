import logger from "../logger/logger";
import { NotificationService } from "../notification/notification-service";
import { validateUsername } from "./user";

export class AuthService {
    private users = new Set<string>();
    private clientNames: { [clientId: string]: string | null } = {};
    private clientIds: { [clientName: string]: Set<string> } = {};

    constructor(private readonly notificationService: NotificationService) {}

    signIn(clientId: string, name: string): void {
        logger.info("Client signed in", { clientId, name });

        if (!validateUsername(name)) {
            logger.error("Invalid user name", { name });

            throw new Error(
                "Invalid user name. Only alphanumeric characters and underscores are allowed."
            );
        }

        this.clientNames[clientId] = name;
        if (!this.clientIds[name]) {
            this.clientIds[name] = new Set();
        }
        this.clientIds[name].add(clientId);
        this.users.add(name);

        this.notificationService.registerUser(clientId, name);
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

        const name = this.clientNames[clientId];
        if (name) {
            this.notificationService.unregisterUser(name, clientId);
        }

        this.clientNames[clientId] = null;

        if (name && this.clientIds[name]) {
            this.clientIds[name].delete(clientId);
        }
    }

    isUserExists(name: string): boolean {
        return this.users.has(name);
    }
}
