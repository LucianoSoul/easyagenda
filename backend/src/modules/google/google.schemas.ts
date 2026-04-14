import { z } from "zod";

export const googleCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1),
  error: z.string().min(1).optional()
});

export type GoogleCallbackQuery = z.infer<typeof googleCallbackQuerySchema>;
