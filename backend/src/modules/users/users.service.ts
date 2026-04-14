import { usersRepository } from "./users.repository.js";
import type { CreateUserInput } from "./users.schemas.js";

export const usersService = {
  async list() {
    return usersRepository.findAll();
  },
  async create(payload: CreateUserInput) {
    return usersRepository.create(payload);
  }
};
