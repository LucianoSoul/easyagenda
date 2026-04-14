import { z } from "zod";

export const applyTemplateSchema = z.object({
  templateCode: z.string().min(1)
});

export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;
