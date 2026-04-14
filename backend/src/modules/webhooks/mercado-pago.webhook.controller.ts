import type { FastifyInstance } from "fastify";
import { mercadoPagoWebhookService } from "./mercado-pago.webhook.service.js";
import type { MercadoPagoWebhookPayload } from "./webhooks.types.js";

export async function registerMercadoPagoWebhookRoutes(app: FastifyInstance) {
  app.post("/mercado-pago", async (request, reply) => {
    const payload = request.body as MercadoPagoWebhookPayload;
    const data = await mercadoPagoWebhookService.handle(payload);
    return reply.status(200).send({ success: true, data });
  });
}
