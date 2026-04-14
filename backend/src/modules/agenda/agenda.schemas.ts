import { z } from "zod";

export const agendaQuerySchema = z
  .object({
    date: z.string().date().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    status: z.string().min(1).optional()
  })
  .superRefine((value, ctx) => {
    const hasRange = value.from !== undefined || value.to !== undefined;

    if (hasRange && (!value.from || !value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Os parametros from e to devem ser informados juntos.",
        path: value.from ? ["to"] : ["from"]
      });
    }
  });

export type AgendaQuery = z.infer<typeof agendaQuerySchema>;
