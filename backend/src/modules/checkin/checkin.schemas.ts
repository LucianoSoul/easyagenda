import { z } from "zod";

export const performCheckinByTokenSchema = z.object({
  token: z.string().min(1)
});

export type PerformCheckinByTokenInput = z.infer<typeof performCheckinByTokenSchema>;
