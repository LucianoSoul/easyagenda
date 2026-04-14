import { z } from "zod";
export const createClientSchema = z.object({
    name: z.string().min(2),
    phone: z.string().optional()
});
