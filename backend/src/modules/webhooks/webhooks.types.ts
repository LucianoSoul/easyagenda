export type MercadoPagoWebhookPayload = {
  action?: string;
  data?: {
    id?: string;
  };
  type?: string;
};
