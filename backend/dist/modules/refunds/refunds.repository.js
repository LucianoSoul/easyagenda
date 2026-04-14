import { supabaseAdmin } from "../../lib/supabase-admin.js";
export class RefundsRepository {
    async findAllByAccount(accountId) {
        const { data, error } = await supabaseAdmin
            .from("refund_decisions")
            .select("*")
            .eq("account_id", accountId)
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return (data ?? []);
    }
    async findPendingByAccount(accountId) {
        const { data, error } = await supabaseAdmin
            .from("refund_decisions")
            .select("*")
            .eq("account_id", accountId)
            .eq("decision_status", "pending")
            .eq("execution_status", "not_processed")
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return (data ?? []);
    }
    async findPending() {
        const { data, error } = await supabaseAdmin
            .from("refund_decisions")
            .select("*")
            .eq("decision_status", "pending")
            .eq("execution_status", "not_processed")
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return (data ?? []);
    }
    async getById(decisionId) {
        const { data, error } = await supabaseAdmin
            .from("refund_decisions")
            .select("*")
            .eq("id", decisionId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async getCreditBySourceDecisionId(decisionId) {
        const { data, error } = await supabaseAdmin
            .from("credits")
            .select("*")
            .eq("source_decision_id", decisionId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async getLatestByAppointment(input) {
        const { data, error } = await supabaseAdmin
            .from("refund_decisions")
            .select("*")
            .eq("appointment_id", input.appointmentId)
            .eq("account_id", input.accountId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async markNoActionNeeded(input) {
        const { error } = await supabaseAdmin.rpc("mark_refund_decision_no_action_needed", {
            p_decision_id: input.decisionId,
            p_applied_by: input.appliedBy
        });
        if (error)
            throw error;
    }
    async createCreditFromRefundDecision(input) {
        const { error } = await supabaseAdmin.rpc("create_credit_from_refund_decision", {
            p_decision_id: input.decisionId,
            p_expires_at: input.expiresAt ?? null,
            p_applied_by: input.appliedBy
        });
        if (error)
            throw error;
    }
    async markProcessed(input) {
        const { error } = await supabaseAdmin.rpc("mark_refund_decision_processed", {
            p_decision_id: input.decisionId,
            p_applied_by: input.appliedBy,
            p_gateway_refund_id: input.gatewayRefundId,
            p_gateway_response: input.gatewayResponse
        });
        if (error)
            throw error;
    }
    async markFailed(input) {
        const { error } = await supabaseAdmin.rpc("mark_refund_decision_failed", {
            p_decision_id: input.decisionId,
            p_applied_by: input.appliedBy,
            p_error_message: input.errorMessage,
            p_gateway_response: input.gatewayResponse ?? null
        });
        if (error)
            throw error;
    }
}
