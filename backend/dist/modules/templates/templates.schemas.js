import { z } from "zod";
export const applyTemplateSchema = z.object({
    templateCode: z.string().min(1)
});
