import { z } from "zod";

export const createAttendanceSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(["present", "absent"])
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
