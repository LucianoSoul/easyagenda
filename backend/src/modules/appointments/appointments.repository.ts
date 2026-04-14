import { supabaseAdmin } from "../../lib/supabase-admin.js";
import {
  getAppointmentDeliverySettings,
  getSchedulingGatewaySettings,
  mergeSchedulingGatewaySettings,
  type AppointmentDeliveryMode,
  type SchedulingGatewaySettings,
  type ServiceAttendanceMode
} from "../../shared/utils/delivery-modes.js";

type UserSettingsRow = {
  user_id: string;
  account_id: string;
  gateway_settings: Record<string, unknown> | null;
};

export class AppointmentsRepository {
  async getClientForUser(input: { clientId: string; accountId: string; userId: string }) {
    const { data, error } = await supabaseAdmin
      .from("clients")
      .select("id, account_id, user_id")
      .eq("id", input.clientId)
      .eq("account_id", input.accountId)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getServiceForUser(input: { serviceId: string; accountId: string; userId: string }) {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("id, account_id, user_id, price, active")
      .eq("id", input.serviceId)
      .eq("account_id", input.accountId)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createAppointment(input: {
    accountId: string;
    userId: string;
    clientId: string;
    serviceId: string;
    startTime: string;
    endTime: string;
    price: number;
    notes?: string;
  }) {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        account_id: input.accountId,
        user_id: input.userId,
        client_id: input.clientId,
        service_id: input.serviceId,
        start_time: input.startTime,
        end_time: input.endTime,
        price: input.price,
        notes: input.notes ?? null,
        status: "pending_payment"
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async getSchedulingSettingsByUserId(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, account_id, gateway_settings")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    const settings = data as UserSettingsRow;
    return {
      settings,
      scheduling: getSchedulingGatewaySettings(settings.gateway_settings)
    };
  }

  async updateSchedulingSettingsByUserId(input: {
    userId: string;
    currentGatewaySettings: Record<string, unknown> | null | undefined;
    schedulingSettings: SchedulingGatewaySettings;
  }) {
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .update({
        gateway_settings: mergeSchedulingGatewaySettings({
          currentGatewaySettings: input.currentGatewaySettings,
          schedulingSettings: input.schedulingSettings
        })
      })
      .eq("user_id", input.userId)
      .select("user_id, account_id, gateway_settings")
      .single();

    if (error) throw error;

    const settings = data as UserSettingsRow;
    return {
      settings,
      scheduling: getSchedulingGatewaySettings(settings.gateway_settings)
    };
  }

  async saveAppointmentDeliveryMode(input: {
    userId: string;
    appointmentId: string;
    deliveryMode: AppointmentDeliveryMode;
    attendanceMode: ServiceAttendanceMode;
  }) {
    const current = await this.getSchedulingSettingsByUserId(input.userId);
    const existing = getAppointmentDeliverySettings(current.scheduling, input.appointmentId);

    return this.updateSchedulingSettingsByUserId({
      userId: input.userId,
      currentGatewaySettings: current.settings.gateway_settings,
      schedulingSettings: {
        ...current.scheduling,
        appointment_delivery_modes: {
          ...(current.scheduling.appointment_delivery_modes ?? {}),
          [input.appointmentId]: {
            ...(existing ?? {}),
            delivery_mode: input.deliveryMode,
            attendance_mode: input.attendanceMode
          }
        }
      }
    });
  }

  async cancelAppointmentFn(input: {
    appointmentId: string;
    cancelledBy: string;
    reason?: string;
  }) {
    const { data, error } = await supabaseAdmin.rpc("cancel_appointment", {
      p_appointment_id: input.appointmentId,
      p_cancelled_by: input.cancelledBy,
      p_cancellation_reason: input.reason ?? null
    });

    if (error) throw error;
    return data as string;
  }

  async getAppointmentById(appointmentId: string) {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (error) throw error;
    return data;
  }

  async getAppointmentByIdForAccount(input: { appointmentId: string; accountId: string }) {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", input.appointmentId)
      .eq("account_id", input.accountId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getAppointmentDeliveryMode(input: {
    userId: string;
    appointmentId: string;
  }): Promise<AppointmentDeliveryMode | null> {
    const current = await this.getSchedulingSettingsByUserId(input.userId);
    return getAppointmentDeliverySettings(current.scheduling, input.appointmentId)?.delivery_mode ?? null;
  }

  async listAppointmentsByAccount(accountId: string) {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("account_id", accountId)
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }
}
