import { supabaseAdmin } from "../../lib/supabase-admin.js";
function pickSingle(value) {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value ?? null;
}
function normalizeAppointmentRow(row) {
    return {
        ...row,
        clients: pickSingle(row.clients),
        services: pickSingle(row.services),
        users: pickSingle(row.users),
        accounts: pickSingle(row.accounts)
    };
}
const appointmentSelect = `
  id,
  account_id,
  client_id,
  service_id,
  user_id,
  start_time,
  end_time,
  status,
  price,
  final_price,
  payment_required_amount,
  notes,
  created_at,
  cancelled_at,
  cancelled_by,
  cancellation_reason,
  checkin_required,
  original_price,
  credit_applied_amount,
  discount_amount,
  clients(id, account_id, name, email, phone),
  services(id, name, description, duration_minutes, price),
  users(id, name, email),
  payments(id, amount, method, gateway, status, external_id, payment_link, qr_code, created_at),
  refund_decisions(id, created_at, decision_status, execution_status, refund_amount, credit_amount, decision_reason, processed_at, gateway_refund_id, gateway_response),
  checkin_tokens(id, token, used, expires_at, created_at),
  attendance(id, status, checkin_method, checked_in_at, created_at),
  accounts(id, name, email, phone)
`;
export class ClientRepository {
    async findClientByEmail(email) {
        const { data, error } = await supabaseAdmin
            .from("clients")
            .select("id, account_id, name, email, phone")
            .ilike("email", email);
        if (error)
            throw error;
        return (data ?? []);
    }
    async countUpcomingConfirmed(input) {
        const { count, error } = await supabaseAdmin
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("account_id", input.accountId)
            .eq("client_id", input.clientId)
            .eq("status", "confirmed")
            .gte("start_time", input.nowIso);
        if (error)
            throw error;
        return count ?? 0;
    }
    async countPendingPayment(input) {
        const { count, error } = await supabaseAdmin
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("account_id", input.accountId)
            .eq("client_id", input.clientId)
            .eq("status", "pending_payment")
            .gte("start_time", input.nowIso);
        if (error)
            throw error;
        return count ?? 0;
    }
    async countCancelledOrPast(input) {
        const { count, error } = await supabaseAdmin
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("account_id", input.accountId)
            .eq("client_id", input.clientId)
            .or(`status.eq.cancelled,end_time.lt.${input.nowIso}`);
        if (error)
            throw error;
        return count ?? 0;
    }
    async listNextAppointments(input) {
        const { data, error } = await supabaseAdmin
            .from("appointments")
            .select(appointmentSelect)
            .eq("account_id", input.accountId)
            .eq("client_id", input.clientId)
            .gte("start_time", input.nowIso)
            .neq("status", "cancelled")
            .neq("status", "no_show")
            .order("start_time", { ascending: true })
            .limit(input.limit);
        if (error)
            throw error;
        return (data ?? []).map(normalizeAppointmentRow);
    }
    async listHistory(input) {
        const { data, error, count } = await supabaseAdmin
            .from("appointments")
            .select(appointmentSelect, { count: "exact" })
            .eq("account_id", input.accountId)
            .eq("client_id", input.clientId)
            .or(`status.eq.cancelled,end_time.lt.${input.nowIso}`)
            .order("start_time", { ascending: false })
            .range(input.from, input.to);
        if (error)
            throw error;
        return {
            data: (data ?? []).map(normalizeAppointmentRow),
            count: count ?? 0
        };
    }
    async getAppointmentDetail(input) {
        const { data, error } = await supabaseAdmin
            .from("appointments")
            .select(appointmentSelect)
            .eq("id", input.appointmentId)
            .eq("account_id", input.accountId)
            .eq("client_id", input.clientId)
            .maybeSingle();
        if (error)
            throw error;
        return data
            ? normalizeAppointmentRow(data)
            : null;
    }
}
