import { clientsRepository } from "./clients.repository.js";
import type { CreateClientInput } from "./clients.schemas.js";

export const clientsService = {
  async list() {
    return clientsRepository.findAll();
  },
  async create(payload: CreateClientInput) {
    return clientsRepository.create(payload);
  }
};
