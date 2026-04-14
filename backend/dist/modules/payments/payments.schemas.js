import { z } from "zod";
export const createPaymentSchema = z.object({
    appointmentId: z.string().min(1),
    amountInCents: z.number().int().nonnegative()
});
export const devApprovePaymentSchema = z.object({
    externalId: z.string().min(1).optional()
});
