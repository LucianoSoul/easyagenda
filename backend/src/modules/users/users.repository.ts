import type { CreateUserInput } from "./users.schemas.js";
import type { User } from "./users.types.js";

export const usersRepository = {
  async findAll(): Promise<User[]> {
    return [];
  },
  async create(payload: CreateUserInput): Promise<User> {
    return { id: "user_1", ...payload };
  }
};
