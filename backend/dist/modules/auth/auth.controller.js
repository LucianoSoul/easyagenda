import { ok } from "../../shared/utils/http.js";
export async function registerAuthRoutes(app) {
    app.get("/me", {
        preHandler: []
    }, async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Token ausente."
                }
            });
        }
        return ok({
            message: "Use GET /auth/me dentro do grupo protegido."
        });
    });
}
