import { supabaseAdmin } from "../../lib/supabase-admin.js";
import type { AttendanceRecord, CheckinTokenRecord } from "./checkin.types.js";

export class CheckinRepository {
  async performByToken(token: string) {
    const { data, error } = await supabaseAdmin.rpc("perform_checkin_by_token", {
      p_token: token
    });

    if (error) throw error;
    return data;
  }

  async getTokenByToken(token: string) {
    const { data, error } = await supabaseAdmin
      .from("checkin_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error) throw error;
    return data as CheckinTokenRecord | null;
  }

  async getLatestAttendanceByAppointmentId(appointmentId: string) {
    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as AttendanceRecord | null;
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
}
