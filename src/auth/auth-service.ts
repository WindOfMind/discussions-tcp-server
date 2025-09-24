import logger from "../logger/logger";
import { NotificationService } from "../notification/notification-service";
import { validateUsername } from "./user";

export class AuthService {
    private users = new Set<string>();
    private clientNames: { [clientId: string]: string | null } = {};
    private clientIds: { [clientName: string]: string } = {};

    constructor(private readonly notificationService: NotificationService) {}

    signIn(clientId: string, name: string): void {
        logger.info("Client signed in", { clientId, name });

        if (!validateUsername(name)) {
            logger.error("Invalid user name", { name });

            throw new Error(
                "Invalid user name. Only alphanumeric characters and underscores are allowed."
            );
        }

        if (this.clientIds[name]) {
            logger.error("Name already taken", {
                name,
                existingClientId: this.clientIds[name],
            });

            throw new Error("Name already taken");
        }

        this.clientNames[clientId] = name;
        this.clientIds[name] = clientId;
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
            this.notificationService.unregisterUser(name);
        }

        this.clientNames[clientId] = null;
        if (name) {
            delete this.clientIds[name];
        }
    }

    isUserExists(name: string): boolean {
        return this.users.has(name);
    }
}
