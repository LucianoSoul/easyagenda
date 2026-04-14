import { z } from "zod";

export const createPaymentSchema = z.object({
  appointmentId: z.string().min(1),
  amountInCents: z.number().int().nonnegative()
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const devApprovePaymentSchema = z.object({
  externalId: z.string().min(1).optional()
});

export type DevApprovePaymentInput = z.infer<typeof devApprovePaymentSchema>;
