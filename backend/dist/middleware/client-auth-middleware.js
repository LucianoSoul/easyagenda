import { supabaseAdmin } from "../lib/supabase-admin.js";
import { AppError } from "../shared/errors/app-error.js";
export async function clientAuthMiddleware(request, _reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        throw new AppError(401, "UNAUTHORIZED", "Token ausente.");
    }
    const accessToken = authHeader.replace("Bearer ", "").trim();
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data.user) {
        throw new AppError(401, "UNAUTHORIZED", "Token invalido.");
    }
    const email = data.user.email?.trim().toLowerCase();
    if (!email) {
        throw new AppError(403, "CLIENT_NOT_LINKED", "Usuario autenticado sem email vinculado.");
    }
    const { data: clients, error: clientError } = await supabaseAdmin
        .from("clients")
        .select("id, account_id, name, email")
        .ilike("email", email);
    if (clientError) {
        throw new AppError(500, "CLIENT_CONTEXT_ERROR", "Nao foi possivel carregar o contexto do cliente.");
    }
    const matchedClients = (clients ?? []);
    if (matchedClients.length === 0) {
        throw new AppError(403, "CLIENT_NOT_LINKED", "Cliente autenticado sem vinculo na aplicacao.");
    }
    if (matchedClients.length > 1) {
        throw new AppError(409, "CLIENT_EMAIL_AMBIGUOUS", "Email do cliente vinculado a mais de um cadastro.");
    }
    const client = matchedClients[0];
    request.contextClient = {
        authUserId: data.user.id,
        clientId: client.id,
        accountId: client.account_id,
        email: client.email,
        name: client.name,
        accessToken
    };
}
