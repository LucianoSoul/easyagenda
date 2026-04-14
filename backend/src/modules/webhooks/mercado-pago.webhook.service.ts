import { webhooksRepository } from "./webhooks.repository.js";
import type { MercadoPagoWebhookPayload } from "./webhooks.types.js";

export const mercadoPagoWebhookService = {
  async handle(payload: MercadoPagoWebhookPayload) {
    return webhooksRepository.saveMercadoPagoEvent(payload);
  }
};
