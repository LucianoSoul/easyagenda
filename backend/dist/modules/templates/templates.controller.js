import { ok } from "../../shared/utils/http.js";
import { TemplatesService } from "./templates.service.js";
import { applyTemplateSchema } from "./templates.schemas.js";
const service = new TemplatesService();
export async function registerTemplateRoutes(app) {
    app.get("/", async (request) => {
        const context = request.contextUser;
        const templates = await service.listTemplatesForUser(context.userId);
        return ok(templates);
    });
    app.post("/apply", async (request) => {
        const context = request.contextUser;
        const body = applyTemplateSchema.parse(request.body);
        const cancellationPolicyId = await service.applyTemplate(context.userId, body.templateCode);
        return ok({ cancellationPolicyId });
    });
}
