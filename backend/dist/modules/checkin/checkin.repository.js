import { supabaseAdmin } from "../../lib/supabase-admin.js";
export class CheckinRepository {
    async performByToken(token) {
        const { data, error } = await supabaseAdmin.rpc("perform_checkin_by_token", {
            p_token: token
        });
        if (error)
            throw error;
        return data;
    }
    async getTokenByToken(token) {
        const { data, error } = await supabaseAdmin
            .from("checkin_tokens")
            .select("*")
            .eq("token", token)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async getLatestAttendanceByAppointmentId(appointmentId) {
        const { data, error } = await supabaseAdmin
            .from("attendance")
            .select("*")
            .eq("appointment_id", appointmentId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async getAppointmentById(appointmentId) {
        const { data, error } = await supabaseAdmin
            .from("appointments")
            .select("*")
            .eq("id", appointmentId)
            .single();
        if (error)
            throw error;
        return data;
    }
}
