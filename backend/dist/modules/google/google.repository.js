import { supabaseAdmin } from "../../lib/supabase-admin.js";
import { getAppointmentDeliverySettings, getSchedulingGatewaySettings, getServiceAttendanceMode } from "../../shared/utils/delivery-modes.js";
const appointmentSelect = `
  id,
  account_id,
  user_id,
  client_id,
  service_id,
  start_time,
  end_time,
  status,
  notes,
  original_price,
  credit_applied_amount,
  final_price,
  payment_required_amount,
  clients(id, name, email, phone),
  services(id, name, description, duration_minutes),
  users(id, name, email),
  accounts(id, name, email, phone)
`;
function getGoogleGatewaySettings(gatewaySettings) {
    if (!gatewaySettings || typeof gatewaySettings !== "object") {
        return {};
    }
    const google = gatewaySettings.google;
    if (!google || typeof google !== "object") {
        return {};
    }
    return google;
}
function mergeGoogleGatewaySettings(input) {
    return {
        ...(input.currentGatewaySettings ?? {}),
        google: input.googleSettings
    };
}
export class GoogleRepository {
    async getGoogleSettingsByUserId(userId) {
        const { data, error } = await supabaseAdmin
            .from("user_settings")
            .select("user_id, account_id, timezone, gateway_settings")
            .eq("user_id", userId)
            .single();
        if (error)
            throw error;
        const settings = data;
        return {
            settings,
            google: getGoogleGatewaySettings(settings.gateway_settings)
        };
    }
    async upsertGoogleConnection(input) {
        const current = await this.getGoogleSettingsByUserId(input.userId);
        const nextGatewaySettings = mergeGoogleGatewaySettings({
            currentGatewaySettings: current.settings.gateway_settings,
            googleSettings: {
                ...current.google,
                connection: input.connection
            }
        });
        const { data, error } = await supabaseAdmin
            .from("user_settings")
            .update({
            gateway_settings: nextGatewaySettings
        })
            .eq("user_id", input.userId)
            .select("user_id, account_id, timezone, gateway_settings")
            .single();
        if (error)
            throw error;
        const settings = data;
        return {
            settings,
            google: getGoogleGatewaySettings(settings.gateway_settings)
        };
    }
    async disconnectGoogleConnection(userId) {
        const current = await this.getGoogleSettingsByUserId(userId);
        const connection = current.google.connection;
        if (!connection) {
            return current;
        }
        const nextGatewaySettings = mergeGoogleGatewaySettings({
            currentGatewaySettings: current.settings.gateway_settings,
            googleSettings: {
                ...current.google,
                connection: {
                    ...connection,
                    access_token: "",
                    refresh_token: null,
                    expiry_date: null,
                    disconnected_at: new Date().toISOString()
                }
            }
        });
        const { data, error } = await supabaseAdmin
            .from("user_settings")
            .update({
            gateway_settings: nextGatewaySettings
        })
            .eq("user_id", userId)
            .select("user_id, account_id, timezone, gateway_settings")
            .single();
        if (error)
            throw error;
        const settings = data;
        return {
            settings,
            google: getGoogleGatewaySettings(settings.gateway_settings)
        };
    }
    async saveAppointmentEventMapping(input) {
        const current = await this.getGoogleSettingsByUserId(input.userId);
        const nextGatewaySettings = mergeGoogleGatewaySettings({
            currentGatewaySettings: current.settings.gateway_settings,
            googleSettings: {
                ...current.google,
                calendar_events: {
                    ...(current.google.calendar_events ?? {}),
                    [input.appointmentId]: input.mapping
                }
            }
        });
        const { data, error } = await supabaseAdmin
            .from("user_settings")
            .update({
            gateway_settings: nextGatewaySettings
        })
            .eq("user_id", input.userId)
            .select("user_id, account_id, timezone, gateway_settings")
            .single();
        if (error)
            throw error;
        const settings = data;
        return {
            settings,
            google: getGoogleGatewaySettings(settings.gateway_settings)
        };
    }
    async getAppointmentSyncContext(input) {
        const { data, error } = await supabaseAdmin
            .from("appointments")
            .select(appointmentSelect)
            .eq("id", input.appointmentId)
            .eq("account_id", input.accountId)
            .maybeSingle();
        if (error)
            throw error;
        if (!data) {
            return null;
        }
        const appointment = data;
        const { data: settingsData, error: settingsError } = await supabaseAdmin
            .from("user_settings")
            .select("gateway_settings")
            .eq("user_id", appointment.user_id)
            .single();
        if (settingsError)
            throw settingsError;
        const scheduling = getSchedulingGatewaySettings(settingsData.gateway_settings);
        const deliverySettings = getAppointmentDeliverySettings(scheduling, appointment.id);
        return {
            ...appointment,
            delivery_mode: deliverySettings?.delivery_mode ?? null,
            service_attendance_mode: deliverySettings?.attendance_mode ??
                getServiceAttendanceMode(scheduling, appointment.service_id),
            clients: Array.isArray(appointment.clients)
                ? (appointment.clients[0] ?? null)
                : appointment.clients,
            services: Array.isArray(appointment.services)
                ? (appointment.services[0] ?? null)
                : appointment.services,
            users: Array.isArray(appointment.users) ? (appointment.users[0] ?? null) : appointment.users,
            accounts: Array.isArray(appointment.accounts)
                ? (appointment.accounts[0] ?? null)
                : appointment.accounts
        };
    }
}
