import { supabaseAdmin } from "../../lib/supabase-admin.js";

type UserSettingsRow = {
  gateway_settings: Record<string, unknown> | null;
};

type ServiceLookupRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
};

export class LookupsRepository {
  async listClients(input: { accountId: string; userId: string }) {
    const { data, error } = await supabaseAdmin
      .from("clients")
      .select("id, name, email, phone")
      .eq("account_id", input.accountId)
      .eq("user_id", input.userId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async listServices(input: { accountId: string; userId: string }) {
    const [{ data: services, error: servicesError }, { data: settings, error: settingsError }] =
      await Promise.all([
        supabaseAdmin
          .from("services")
          .select("id, name, description, duration_minutes, price")
          .eq("account_id", input.accountId)
          .eq("user_id", input.userId)
          .eq("active", true)
          .order("name", { ascending: true }),
        supabaseAdmin
          .from("user_settings")
          .select("gateway_settings")
          .eq("user_id", input.userId)
          .single()
      ]);

    if (servicesError) throw servicesError;
    if (settingsError) throw settingsError;

    return {
      services: (services ?? []) as ServiceLookupRow[],
      gatewaySettings: (settings as UserSettingsRow).gateway_settings
    };
  }
}
