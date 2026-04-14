import { z } from "zod";

export const clientHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10)
});

export type ClientHistoryQuery = z.infer<typeof clientHistoryQuerySchema>;
