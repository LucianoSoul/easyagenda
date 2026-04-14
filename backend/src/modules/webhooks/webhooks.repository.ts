import type { MercadoPagoWebhookPayload } from "./webhooks.types.js";

export const webhooksRepository = {
  async saveMercadoPagoEvent(payload: MercadoPagoWebhookPayload) {
    return {
      id: "webhook_1",
      receivedAt: new Date().toISOString(),
      payload
    };
  }
};
