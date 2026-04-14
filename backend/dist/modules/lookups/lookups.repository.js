import { supabaseAdmin } from "../../lib/supabase-admin.js";
export class LookupsRepository {
    async listClients(input) {
        const { data, error } = await supabaseAdmin
            .from("clients")
            .select("id, name, email, phone")
            .eq("account_id", input.accountId)
            .eq("user_id", input.userId)
            .order("name", { ascending: true });
        if (error)
            throw error;
        return data ?? [];
    }
    async listServices(input) {
        const [{ data: services, error: servicesError }, { data: settings, error: settingsError }] = await Promise.all([
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
        if (servicesError)
            throw servicesError;
        if (settingsError)
            throw settingsError;
        return {
            services: (services ?? []),
            gatewaySettings: settings.gateway_settings
        };
    }
}
