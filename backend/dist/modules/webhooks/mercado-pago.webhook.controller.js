import { mercadoPagoWebhookService } from "./mercado-pago.webhook.service.js";
export async function registerMercadoPagoWebhookRoutes(app) {
    app.post("/mercado-pago", async (request, reply) => {
        const payload = request.body;
        const data = await mercadoPagoWebhookService.handle(payload);
        return reply.status(200).send({ success: true, data });
    });
}
