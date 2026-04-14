import type { FastifyReply, FastifyRequest } from "fastify";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { AppError } from "../shared/errors/app-error.js";

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Token ausente.");
  }

  const accessToken = authHeader.replace("Bearer ", "").trim();

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new AppError(401, "UNAUTHORIZED", "Token invalido.");
  }

  const { data: appUser, error: appUserError } = await supabaseAdmin
    .from("users")
    .select("id, account_id, role, status")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (appUserError) {
    throw new AppError(
      500,
      "USER_CONTEXT_ERROR",
      "Nao foi possivel carregar o contexto do usuario."
    );
  }

  if (!appUser) {
    throw new AppError(
      403,
      "USER_NOT_LINKED",
      "Usuario autenticado sem vinculo na aplicacao."
    );
  }

  if (appUser.status !== "active") {
    throw new AppError(403, "USER_INACTIVE", "Usuario inativo.");
  }

  request.contextUser = {
    authUserId: data.user.id,
    userId: appUser.id,
    accountId: appUser.account_id,
    role: appUser.role,
    accessToken
  };
}
