import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(2)
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
