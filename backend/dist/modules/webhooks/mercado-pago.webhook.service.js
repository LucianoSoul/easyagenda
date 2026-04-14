import { webhooksRepository } from "./webhooks.repository.js";
export const mercadoPagoWebhookService = {
    async handle(payload) {
        return webhooksRepository.saveMercadoPagoEvent(payload);
    }
};
