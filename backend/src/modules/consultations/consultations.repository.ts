import { supabaseAdmin } from "../../lib/supabase-admin.js";
import { getAppointmentDeliverySettings, getSchedulingGatewaySettings, getServiceAttendanceMode } from "../../shared/utils/delivery-modes.js";
import type { ConsultationStatusAppointment } from "./consultations.types.js";
import type { GoogleAppointmentEventMapping } from "../google/google.types.js";
import type { Payment } from "../payments/payments.types.js";

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

type ConsultationSettingsRow = {
  gateway_settings: Record<string, unknown> | null;
};

type GoogleGatewaySnapshot = {
  calendar_events?: Record<string, GoogleAppointmentEventMapping>;
};

export class ConsultationsRepository {
  async consultationExists(appointmentId: string) {
    const { count, error } = await supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("id", appointmentId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async getConsultationAppointmentForAccount(input: {
    appointmentId: string;
    accountId: string;
  }): Promise<ConsultationStatusAppointment | null> {
    return this.getConsultationAppointment({
      appointmentId: input.appointmentId,
      accountId: input.accountId
    });
  }

  async getPublicConsultationAppointment(appointmentId: string): Promise<ConsultationStatusAppointment | null> {
    return this.getConsultationAppointment({ appointmentId });
  }

  private async getConsultationAppointment(input: {
    appointmentId: string;
    accountId?: string;
  }): Promise<ConsultationStatusAppointment | null> {
    let query = supabaseAdmin
      .from("appointments")
      .select(consultationAppointmentSelect)
      .eq("id", input.appointmentId);

    if (input.accountId) {
      query = query.eq("account_id", input.accountId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    if (!data) {
      return null;
    }

    const appointment = data as ConsultationStatusAppointment & {
      clients: ConsultationStatusAppointment["clients"] | ConsultationStatusAppointment["clients"][];
      services: ConsultationStatusAppointment["services"] | ConsultationStatusAppointment["services"][];
      users: ConsultationStatusAppointment["users"] | ConsultationStatusAppointment["users"][];
    };

    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from("user_settings")
      .select("gateway_settings")
      .eq("user_id", appointment.user_id)
      .single();

    if (settingsError) throw settingsError;

    const gatewaySettings = (settingsData as ConsultationSettingsRow).gateway_settings;
    const scheduling = getSchedulingGatewaySettings(gatewaySettings);
    const deliverySettings = getAppointmentDeliverySettings(scheduling, appointment.id);

    return {
      ...appointment,
      delivery_mode: deliverySettings?.delivery_mode ?? null,
      service_attendance_mode:
        deliverySettings?.attendance_mode ??
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

  async getLatestPaymentForAppointment(input: { appointmentId: string; accountId: string }) {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("appointment_id", input.appointmentId)
      .eq("account_id", input.accountId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as Payment | null;
  }

  async getGoogleEventMappingForAppointment(input: { appointmentId: string; userId: string }) {
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .select("gateway_settings")
      .eq("user_id", input.userId)
      .single();

    if (error) throw error;

    const gatewaySettings = (data as ConsultationSettingsRow).gateway_settings;
    const googleSettings = (
      gatewaySettings &&
      typeof gatewaySettings === "object" &&
      gatewaySettings.google &&
      typeof gatewaySettings.google === "object"
        ? gatewaySettings.google
        : {}
    ) as GoogleGatewaySnapshot;

    return googleSettings.calendar_events?.[input.appointmentId] ?? null;
  }
}
