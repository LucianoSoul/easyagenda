import type { FastifyInstance } from "fastify";
import { ok } from "../../shared/utils/http.js";
import { LookupsService } from "./lookups.service.js";

const service = new LookupsService();

export async function registerLookupRoutes(app: FastifyInstance) {
  app.get("/clients", async (request) => {
    const context = request.contextUser!;
    const data = await service.listClients({
      accountId: context.accountId,
      userId: context.userId
    });

    return ok(data);
  });

  app.get("/services", async (request) => {
    const context = request.contextUser!;
    const data = await service.listServices({
      accountId: context.accountId,
      userId: context.userId
    });

    return ok(data);
  });
}
