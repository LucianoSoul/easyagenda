import type { FastifyInstance } from "fastify";
import { ok } from "../../shared/utils/http.js";
import { clientHistoryQuerySchema } from "./client.schemas.js";
import { ClientService } from "./client.service.js";

const service = new ClientService();

export async function registerClientRoutes(app: FastifyInstance) {
  app.get("/dashboard", async (request) => {
    const context = request.contextClient!;
    const data = await service.getDashboard({
      clientId: context.clientId,
      accountId: context.accountId
    });

    return ok(data);
  });

  app.get("/appointments/history", async (request) => {
    const context = request.contextClient!;
    const query = clientHistoryQuerySchema.parse(request.query ?? {});

    const data = await service.getAppointmentHistory({
      clientId: context.clientId,
      accountId: context.accountId,
      query
    });

    return ok(data);
  });

  app.get("/appointments/:id", async (request) => {
    const params = request.params as { id: string };
    const context = request.contextClient!;

    const data = await service.getAppointmentDetail({
      appointmentId: params.id,
      clientId: context.clientId,
      accountId: context.accountId
    });

    return ok(data);
  });
}
