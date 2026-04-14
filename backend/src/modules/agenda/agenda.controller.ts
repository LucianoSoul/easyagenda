import type { FastifyInstance } from "fastify";
import { ok } from "../../shared/utils/http.js";
import { agendaQuerySchema } from "./agenda.schemas.js";
import { AgendaService } from "./agenda.service.js";

const service = new AgendaService();

export async function registerAgendaRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const context = request.contextUser!;
    const query = agendaQuerySchema.parse(request.query ?? {});
    const data = await service.listAgenda({
      accountId: context.accountId,
      query
    });

    return ok(data);
  });
}
