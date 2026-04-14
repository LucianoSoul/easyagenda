import { ok } from "../../shared/utils/http.js";
import { SettingsService } from "./settings.service.js";
import { updateSettingsSchema } from "./settings.schemas.js";
import { getSchedulingGatewaySettings, mergeSchedulingGatewaySettings } from "../../shared/utils/delivery-modes.js";
const service = new SettingsService();
export async function registerSettingsRoutes(app) {
    app.get("/", async (request) => {
        const context = request.contextUser;
        const settings = await service.getSettings(context.userId);
        return ok(settings);
    });
    app.patch("/", async (request) => {
        const context = request.contextUser;
        const body = updateSettingsSchema.parse(request.body);
        const patch = {};
        if (body.timezone !== undefined)
            patch.timezone = body.timezone;
        if (body.noShowAfterMinutes !== undefined)
            patch.no_show_after_minutes = body.noShowAfterMinutes;
        if (body.checkinOpensBeforeMinutes !== undefined)
            patch.checkin_opens_before_minutes = body.checkinOpensBeforeMinutes;
        if (body.checkinExpiresAfterMinutes !== undefined)
            patch.checkin_expires_after_minutes = body.checkinExpiresAfterMinutes;
        if (body.defaultPaymentGateway !== undefined)
            patch.default_payment_gateway = body.defaultPaymentGateway;
        if (body.pixKey !== undefined)
            patch.pix_key = body.pixKey;
        if (body.professionalProfile !== undefined)
            patch.professional_profile = body.professionalProfile;
        if (body.serviceAttendanceModes !== undefined) {
            const currentSettings = await service.getSettings(context.userId);
            const schedulingSettings = getSchedulingGatewaySettings(currentSettings.gateway_settings);
            patch.gateway_settings = mergeSchedulingGatewaySettings({
                currentGatewaySettings: currentSettings.gateway_settings,
                schedulingSettings: {
                    ...schedulingSettings,
                    service_delivery_modes: {
                        ...(schedulingSettings.service_delivery_modes ?? {}),
                        ...body.serviceAttendanceModes
                    }
                }
            });
        }
        const settings = await service.updateSettings(context.userId, patch);
        return ok(settings);
    });
}
