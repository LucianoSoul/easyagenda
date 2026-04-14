import { supabaseAdmin } from "../lib/supabase-admin.js";
export async function processNoShowsJob() {
    const { data, error } = await supabaseAdmin.rpc("process_no_shows");
    if (error) {
        throw error;
    }
    return data;
}
