import { createRequestId } from "../../shared/utils/ids.js";
import { supabaseAdmin } from "../../lib/supabase-admin.js";
export class PaymentsRepository {
    async findAllByAccount(accountId) {
        const { data, error } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("account_id", accountId)
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return (data ?? []);
    }
    async getByIdForAccount(input) {
        const { data, error } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("id", input.paymentId)
            .eq("account_id", input.accountId)
            .single();
        if (error)
            throw error;
        return data;
    }
    async create(payload) {
        return {
            id: createRequestId(),
            appointment_id: payload.appointmentId,
            user_id: "",
            amount: payload.amountInCents,
            method: "pix",
            gateway: "mercado_pago",
            status: "pending",
            external_id: null,
            payment_link: null,
            qr_code: null,
            created_at: new Date().toISOString(),
            account_id: ""
        };
    }
    async createForAppointment(input) {
        const { data, error } = await supabaseAdmin.rpc("create_payment_for_appointment", {
            p_appointment_id: input.appointmentId,
            p_user_id: input.userId
        });
        if (error)
            throw error;
        return String(data);
    }
    async getByAppointmentId(input) {
        const { data, error } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("appointment_id", input.appointmentId)
            .eq("account_id", input.accountId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
        if (error)
            throw error;
        return data;
    }
    async approveForAccount(input) {
        const { data, error } = await supabaseAdmin
            .from("payments")
            .update({
            status: "approved",
            external_id: input.externalId
        })
            .eq("id", input.paymentId)
            .eq("account_id", input.accountId)
            .select("*")
            .single();
        if (error)
            throw error;
        return data;
    }
    async listCheckinTokensByAppointment(input) {
        const { data, error } = await supabaseAdmin
            .from("checkin_tokens")
            .select("*")
            .eq("appointment_id", input.appointmentId)
            .eq("account_id", input.accountId)
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return (data ?? []);
    }
}
