import { z } from "zod";

export const createConsultationSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  deliveryMode: z.string(),
  notes: z.string().optional()
}).refine((value) => new Date(value.endTime) > new Date(value.startTime), {
  message: "endTime must be after startTime",
  path: ["endTime"]
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
