import { z } from "zod";
export const createServiceSchema = z.object({
    name: z.string().min(2),
    priceInCents: z.number().int().nonnegative()
});
