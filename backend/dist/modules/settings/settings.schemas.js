import { z } from "zod";
import { serviceAttendanceModes } from "../../shared/utils/delivery-modes.js";
export const updateSettingsSchema = z.object({
    timezone: z.string().optional(),
    noShowAfterMinutes: z.number().int().min(0).optional(),
    checkinOpensBeforeMinutes: z.number().int().min(0).optional(),
    checkinExpiresAfterMinutes: z.number().int().min(0).optional(),
    defaultPaymentGateway: z.string().optional(),
    pixKey: z.string().optional(),
    professionalProfile: z.string().optional(),
    serviceAttendanceModes: z.record(z.enum(serviceAttendanceModes)).optional()
});
