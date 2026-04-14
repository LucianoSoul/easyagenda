import type { CreateClientInput } from "./clients.schemas.js";
import type { Client } from "./clients.types.js";

export const clientsRepository = {
  async findAll(): Promise<Client[]> {
    return [];
  },
  async create(payload: CreateClientInput): Promise<Client> {
    return { id: "client_1", ...payload };
  }
};
