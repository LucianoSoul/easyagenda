import { creditsRepository } from "./credits.repository.js";
import type { CreateCreditInput } from "./credits.schemas.js";

export const creditsService = {
  async list() {
    return creditsRepository.findAll();
  },
  async create(payload: CreateCreditInput) {
    return creditsRepository.create(payload);
  }
};
