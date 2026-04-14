export const webhooksRepository = {
    async saveMercadoPagoEvent(payload) {
        return {
            id: "webhook_1",
            receivedAt: new Date().toISOString(),
            payload
        };
    }
};
