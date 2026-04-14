import { ok } from "../../shared/utils/http.js";
import { AppError } from "../../shared/errors/app-error.js";
import { googleCallbackQuerySchema } from "./google.schemas.js";
import { GoogleService } from "./google.service.js";
const service = new GoogleService();
function getRequestOrigin(request) {
    const forwardedProto = request.headers["x-forwarded-proto"];
    const proto = typeof forwardedProto === "string"
        ? forwardedProto.split(",")[0]
        : request.protocol ?? "http";
    const host = typeof request.headers.host === "string" ? request.headers.host : "";
    if (!host) {
        throw new AppError(400, "INVALID_REQUEST", "Host da requisicao nao informado.");
    }
    return `${proto}://${host}`;
}
export async function registerGooglePublicRoutes(app) {
    app.get("/callback", async (request) => {
        const query = googleCallbackQuerySchema.parse(request.query ?? {});
        if (query.error) {
            throw new AppError(400, "GOOGLE_OAUTH_FAILED", `Google OAuth retornou erro: ${query.error}`);
        }
        if (!query.code) {
            throw new AppError(400, "GOOGLE_OAUTH_FAILED", "Codigo OAuth do Google ausente.");
        }
        const data = await service.handleCallback({
            code: query.code,
            state: query.state
        });
        return ok(data);
    });
}
export async function registerGoogleRoutes(app) {
    app.get("/connect-url", async (request) => {
        const context = request.contextUser;
        const origin = getRequestOrigin(request);
        const data = await service.getConnectUrl({
            accountId: context.accountId,
            userId: context.userId,
            origin
        });
        return ok(data);
    });
    app.get("/status", async (request) => {
        const context = request.contextUser;
        const data = await service.getStatus(context.userId);
        return ok(data);
    });
    app.post("/disconnect", async (request) => {
        const context = request.contextUser;
        const data = await service.disconnect(context.userId);
        return ok(data);
    });
}
