import { z } from "zod";
import { ok } from "../../shared/utils/http.js";
import { AuthService } from "./auth.service.js";
const service = new AuthService();
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});
export async function registerPublicAuthRoutes(app) {
    app.post("/dev-login", async (request) => {
        const body = loginSchema.parse(request.body);
        const session = await service.signInWithPassword(body.email, body.password);
        return ok(session);
    });
}
