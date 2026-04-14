import { supabaseAdmin } from "../../lib/supabase-admin.js";
import type { CreditRecord, RefundDecision } from "./refunds.types.js";

export class RefundsRepository {
  async findAllByAccount(accountId: string): Promise<RefundDecision[]> {
    const { data, error } = await supabaseAdmin
      .from("refund_decisions")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as RefundDecision[];
  }

  async findPendingByAccount(accountId: string): Promise<RefundDecision[]> {
    const { data, error } = await supabaseAdmin
      .from("refund_decisions")
      .select("*")
      .eq("account_id", accountId)
      .eq("decision_status", "pending")
      .eq("execution_status", "not_processed")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as RefundDecision[];
  }

  async findPending(): Promise<RefundDecision[]> {
    const { data, error } = await supabaseAdmin
      .from("refund_decisions")
      .select("*")
      .eq("decision_status", "pending")
      .eq("execution_status", "not_processed")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as RefundDecision[];
  }

  async getById(decisionId: string): Promise<RefundDecision | null> {
    const { data, error } = await supabaseAdmin
      .from("refund_decisions")
      .select("*")
      .eq("id", decisionId)
      .maybeSingle();

    if (error) throw error;
    return data as RefundDecision | null;
  }

  async getCreditBySourceDecisionId(decisionId: string): Promise<CreditRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("credits")
      .select("*")
      .eq("source_decision_id", decisionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as CreditRecord | null;
  }

  async getLatestByAppointment(input: {
    appointmentId: string;
    accountId: string;
  }): Promise<RefundDecision | null> {
    const { data, error } = await supabaseAdmin
      .from("refund_decisions")
      .select("*")
      .eq("appointment_id", input.appointmentId)
      .eq("account_id", input.accountId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as RefundDecision | null;
  }

  async markNoActionNeeded(input: {
    decisionId: string;
    appliedBy: string | null;
  }) {
    const { error } = await supabaseAdmin.rpc("mark_refund_decision_no_action_needed", {
      p_decision_id: input.decisionId,
      p_applied_by: input.appliedBy
    });

    if (error) throw error;
  }

  async createCreditFromRefundDecision(input: {
    decisionId: string;
    appliedBy: string | null;
    expiresAt?: string | null;
  }) {
    const { error } = await supabaseAdmin.rpc("create_credit_from_refund_decision", {
      p_decision_id: input.decisionId,
      p_expires_at: input.expiresAt ?? null,
      p_applied_by: input.appliedBy
    });

    if (error) throw error;
  }

  async markProcessed(input: {
    decisionId: string;
    appliedBy: string | null;
    gatewayRefundId: string;
    gatewayResponse: Record<string, unknown>;
  }) {
    const { error } = await supabaseAdmin.rpc("mark_refund_decision_processed", {
      p_decision_id: input.decisionId,
      p_applied_by: input.appliedBy,
      p_gateway_refund_id: input.gatewayRefundId,
      p_gateway_response: input.gatewayResponse
    });

    if (error) throw error;
  }

  async markFailed(input: {
    decisionId: string;
    appliedBy: string | null;
    errorMessage: string;
    gatewayResponse?: Record<string, unknown> | null;
  }) {
    const { error } = await supabaseAdmin.rpc("mark_refund_decision_failed", {
      p_decision_id: input.decisionId,
      p_applied_by: input.appliedBy,
      p_error_message: input.errorMessage,
      p_gateway_response: input.gatewayResponse ?? null
    });

    if (error) throw error;
  }
}
