import { ok } from "../../shared/utils/http.js";
export async function registerProtectedAuthRoutes(app) {
    app.get("/me", async (request) => {
        return ok({
            authUserId: request.contextUser?.authUserId,
            userId: request.contextUser?.userId,
            accountId: request.contextUser?.accountId,
            role: request.contextUser?.role
        });
    });
}
