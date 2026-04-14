import { accountsRepository } from "./accounts.repository.js";
import type { CreateAccountInput } from "./accounts.schemas.js";

export const accountsService = {
  async list() {
    return accountsRepository.findAll();
  },
  async create(payload: CreateAccountInput) {
    return accountsRepository.create(payload);
  }
};
