import type { Account } from "./accounts.types.js";
import type { CreateAccountInput } from "./accounts.schemas.js";

export const accountsRepository = {
  async findAll(): Promise<Account[]> {
    return [];
  },
  async create(payload: CreateAccountInput): Promise<Account> {
    return { id: "account_1", name: payload.name, status: "active" };
  }
};
