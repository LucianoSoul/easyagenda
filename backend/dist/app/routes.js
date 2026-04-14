import { authMiddleware } from "../middleware/auth-middleware.js";
import { clientAuthMiddleware } from "../middleware/client-auth-middleware.js";
import { requestContextMiddleware } from "../middleware/request-context-middleware.js";
import { registerAgendaRoutes } from "../modules/agenda/agenda.controller.js";
import { registerAppointmentRoutes } from "../modules/appointments/appointments.controller.js";
import { registerClientRoutes } from "../modules/client/client.controller.js";
import { registerPaymentRoutes } from "../modules/payments/payments.controller.js";
import { registerMercadoPagoWebhookRoutes } from "../modules/webhooks/mercado-pago.webhook.controller.js";
import { registerProtectedAuthRoutes } from "../modules/auth/auth.protected.controller.js";
import { registerPublicAuthRoutes } from "../modules/auth/auth.public.controller.js";
import { registerGooglePublicRoutes, registerGoogleRoutes } from "../modules/google/google.controller.js";
import { registerConsultationPublicRoutes, registerConsultationRoutes } from "../modules/consultations/consultations.controller.js";
import { registerCheckinRoutes } from "../modules/checkin/checkin.controller.js";
import { registerLookupRoutes } from "../modules/lookups/lookups.controller.js";
import { registerSettingsRoutes } from "../modules/settings/settings.controller.js";
import { registerTemplateRoutes } from "../modules/templates/templates.controller.js";
import { registerRefundRoutes } from "../modules/refunds/refunds.controller.js";
export async function registerRoutes(app) {
    app.get("/health", async () => ({
        success: true,
        data: { status: "ok" }
    }));
    await app.register(registerMercadoPagoWebhookRoutes, {
        prefix: "/webhooks"
    });
    await app.register(registerPublicAuthRoutes, {
        prefix: "/auth"
    });
    await app.register(registerGooglePublicRoutes, {
        prefix: "/integrations/google"
    });
    await app.register(registerConsultationPublicRoutes, {
        prefix: "/consultations"
    });
    await app.register(registerCheckinRoutes, {
        prefix: "/checkin"
    });
    app.register(async (clientApp) => {
        clientApp.addHook("preHandler", clientAuthMiddleware);
        await clientApp.register(registerClientRoutes, {
            prefix: "/client"
        });
    });
    app.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", authMiddleware);
        protectedApp.addHook("preHandler", requestContextMiddleware);
        await protectedApp.register(registerProtectedAuthRoutes, {
            prefix: "/auth"
        });
        await protectedApp.register(registerGoogleRoutes, {
            prefix: "/integrations/google"
        });
        await protectedApp.register(registerConsultationRoutes, {
            prefix: "/consultations"
        });
        await protectedApp.register(registerAgendaRoutes, {
            prefix: "/agenda"
        });
        await protectedApp.register(registerAppointmentRoutes, {
            prefix: "/appointments"
        });
        await protectedApp.register(registerPaymentRoutes, {
            prefix: "/payments"
        });
        await protectedApp.register(registerSettingsRoutes, {
            prefix: "/settings"
        });
        await protectedApp.register(registerTemplateRoutes, {
            prefix: "/policy-templates"
        });
        await protectedApp.register(registerRefundRoutes, {
            prefix: "/refund-decisions"
        });
        await protectedApp.register(registerLookupRoutes, {
            prefix: "/lookups"
        });
    });
}
