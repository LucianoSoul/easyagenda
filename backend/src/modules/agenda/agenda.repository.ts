import { supabaseAdmin } from "../../lib/supabase-admin.js";
import { getSchedulingGatewaySettings } from "../../shared/utils/delivery-modes.js";
import type { AgendaAppointmentRow } from "./agenda.types.js";

const agendaSelect = `
  id,
  user_id,
  service_id,
  start_time,
  end_time,
  status,
  notes,
  original_price,
  credit_applied_amount,
  final_price,
  payment_required_amount,
  cancelled_at,
  cancelled_by,
  clients(id, name, email, phone),
  services(id, name, duration_minutes),
  payments(id, status, amount, method, gateway, external_id, created_at),
  attendance(id, status, checked_in_at, checkin_method, created_at),
  checkin_tokens(id, token, used, expires_at, created_at)
`;

type ListAgendaInput = {
  accountId: string;
  startTime: string;
  endTime: string;
  status?: string;
};

export class AgendaRepository {
  async listAgenda(input: ListAgendaInput): Promise<AgendaAppointmentRow[]> {
    let query = supabaseAdmin
      .from("appointments")
      .select(agendaSelect)
      .eq("account_id", input.accountId)
      .gte("start_time", input.startTime)
      .lt("start_time", input.endTime)
      .order("start_time", { ascending: true });

    if (input.status) {
      query = query.eq("status", input.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data ?? []) as unknown as AgendaAppointmentRow[];
  }

  async listSchedulingSettingsByUserIds(userIds: string[]) {
    if (userIds.length === 0) {
      return new Map<string, ReturnType<typeof getSchedulingGatewaySettings>>();
    }

    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, gateway_settings")
      .in("user_id", userIds);

    if (error) throw error;

    return new Map(
      (data ?? []).map((row) => [
        row.user_id as string,
        getSchedulingGatewaySettings(
          (row as { gateway_settings: Record<string, unknown> | null }).gateway_settings
        )
      ])
    );
  }
}
