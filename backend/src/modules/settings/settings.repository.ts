import { supabaseAdmin } from "../../lib/supabase-admin.js";

export class SettingsRepository {
  async getByUserId(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateByUserId(userId: string, patch: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .update(patch)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }
}
