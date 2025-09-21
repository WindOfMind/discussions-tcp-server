export class AuthService {
  private clientNames: { [clientId: string]: string | null } = {};
  private clientIds: { [clientName: string]: string } = {};

  signIn(clientId: string, name: string): void {
    console.log(`Client signed in with ID: ${name}`);

    this.clientNames[clientId] = name;
    this.clientIds[name] = clientId;
  }

  whoAmI(clientId: string): string | null {
    console.log(`Current client name: ${this.clientNames[clientId]}`);

    return this.clientNames[clientId] || null;
  }

  signOut(clientId: string): void {
    console.log(`Client signed out with ID: ${clientId}`);

    this.clientNames[clientId] = null;
  }

  getClientIdByName(name: string): string | null {
    return this.clientIds[name] || null;
  }
}
