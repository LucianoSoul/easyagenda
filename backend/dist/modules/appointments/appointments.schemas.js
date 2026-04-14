import { z } from "zod";
export const createAppointmentSchema = z.object({
    clientId: z.string().min(1),
    serviceId: z.string().min(1),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    price: z.number().nonnegative().optional(),
    notes: z.string().optional(),
    deliveryMode: z.string().optional()
}).refine((value) => new Date(value.endTime) > new Date(value.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"]
});
export const cancelAppointmentSchema = z.object({
    cancelledBy: z.enum(["client", "professional", "system"]),
    reason: z.string().optional()
});
