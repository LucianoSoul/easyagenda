import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(2),
  priceInCents: z.number().int().nonnegative()
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
