import { supabaseAdmin } from "../../lib/supabase-admin.js";
export class TemplatesRepository {
    async listByProfile(profileType) {
        const { data, error } = await supabaseAdmin
            .from("refund_policy_templates")
            .select("*")
            .eq("active", true)
            .in("profile_type", [profileType, "general"])
            .order("sort_order", { ascending: true });
        if (error)
            throw error;
        return data ?? [];
    }
    async applyTemplate(userId, templateCode) {
        const { data, error } = await supabaseAdmin.rpc("apply_refund_policy_template", {
            p_user_id: userId,
            p_template_code: templateCode
        });
        if (error)
            throw error;
        return data;
    }
}
