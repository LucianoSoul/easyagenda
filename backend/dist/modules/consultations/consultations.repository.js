import { supabaseAdmin } from "../../lib/supabase-admin.js";
import { getAppointmentDeliverySettings, getSchedulingGatewaySettings, getServiceAttendanceMode } from "../../shared/utils/delivery-modes.js";
const consultationAppointmentSelect = `
  id,
  account_id,
  user_id,
  service_id,
  start_time,
  end_time,
  status,
  notes,
  clients(id, name, email, phone),
  services(id, name),
  users(id, name)
`;
export class ConsultationsRepository {
    async consultationExists(appointmentId) {
        const { count, error } = await supabaseAdmin
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("id", appointmentId);
        if (error)
            throw error;
        return (count ?? 0) > 0;
    }
    async getConsultationAppointmentForAccount(input) {
        return this.getConsultationAppointment({
            appointmentId: input.appointmentId,
            accountId: input.accountId
        });
    }
    async getPublicConsultationAppointment(appointmentId) {
        return this.getConsultationAppointment({ appointmentId });
    }
    async getConsultationAppointment(input) {
        let query = supabaseAdmin
            .from("appointments")
            .select(consultationAppointmentSelect)
            .eq("id", input.appointmentId);
        if (input.accountId) {
            query = query.eq("account_id", input.accountId);
        }
        const { data, error } = await query.maybeSingle();
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
        const gatewaySettings = settingsData.gateway_settings;
        const scheduling = getSchedulingGatewaySettings(gatewaySettings);
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
            users: Array.isArray(appointment.users) ? (appointment.users[0] ?? null) : appointment.users
        };
    }
    async getLatestPaymentForAppointment(input) {
        const { data, error } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("appointment_id", input.appointmentId)
            .eq("account_id", input.accountId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error)
            throw error;
        return (data ?? null);
    }
    async getGoogleEventMappingForAppointment(input) {
        const { data, error } = await supabaseAdmin
            .from("user_settings")
            .select("gateway_settings")
            .eq("user_id", input.userId)
            .single();
        if (error)
            throw error;
        const gatewaySettings = data.gateway_settings;
        const googleSettings = (gatewaySettings &&
            typeof gatewaySettings === "object" &&
            gatewaySettings.google &&
            typeof gatewaySettings.google === "object"
            ? gatewaySettings.google
            : {});
        return googleSettings.calendar_events?.[input.appointmentId] ?? null;
    }
}
