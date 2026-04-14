import type { CreateCreditInput } from "./credits.schemas.js";
import type { Credit } from "./credits.types.js";

export const creditsRepository = {
  async findAll(): Promise<Credit[]> {
    return [];
  },
  async create(payload: CreateCreditInput): Promise<Credit> {
    return { id: "credit_1", ...payload };
  }
};
