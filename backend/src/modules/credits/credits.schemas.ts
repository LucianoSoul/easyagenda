import { z } from "zod";

export const createCreditSchema = z.object({
  clientId: z.string().min(1),
  balanceInCents: z.number().int().nonnegative()
});

export type CreateCreditInput = z.infer<typeof createCreditSchema>;
