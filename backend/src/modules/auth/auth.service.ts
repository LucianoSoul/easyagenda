import { supabaseAdmin } from "../../lib/supabase-admin.js";
import { AppError } from "../../shared/errors/app-error.js";

export class AuthService {
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: data.user
    };
  }
}