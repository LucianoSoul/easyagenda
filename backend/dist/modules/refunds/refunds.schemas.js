import { z } from "zod";
export const createRefundSchema = z.object({
    paymentId: z.string().min(1)
});
