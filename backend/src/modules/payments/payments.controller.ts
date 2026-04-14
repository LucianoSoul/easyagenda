import type { FastifyInstance } from "fastify";
import { ok } from "../../shared/utils/http.js";
import { PaymentsService } from "./payments.service.js";
import { devApprovePaymentSchema } from "./payments.schemas.js";

const service = new PaymentsService();

export async function registerPaymentRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const context = request.contextUser!;
    const payments = await service.list(context.accountId);
    return ok(payments);
  });

  app.get("/:id", async (request) => {
    const params = request.params as { id: string };
    const context = request.contextUser!;
    const payment = await service.getPaymentById({
      paymentId: params.id,
      accountId: context.accountId
    });
    return ok(payment);
  });

  app.post("/appointment/:appointmentId", async (request) => {
    const params = request.params as { appointmentId: string };
    const context = request.contextUser!;
    const payment = await service.createPaymentForAppointment({
      appointmentId: params.appointmentId,
      userId: context.userId,
      accountId: context.accountId
    });

    return ok(payment);
  });

  app.post("/:id/dev-approve", async (request) => {
    const params = request.params as { id: string };
    const context = request.contextUser!;
    const body = devApprovePaymentSchema.parse(request.body ?? {});

    const result = await service.devApprovePayment({
      paymentId: params.id,
      accountId: context.accountId,
      body
    });

    return ok(result);
  });
}
