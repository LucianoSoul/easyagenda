import { ok } from "../../shared/utils/http.js";
import { createConsultationSchema } from "./consultations.schemas.js";
import { ConsultationsService } from "./consultations.service.js";
const service = new ConsultationsService();
export async function registerConsultationPublicRoutes(app) {
    app.get("/:id/public-status", async (request) => {
        const params = request.params;
        const data = await service.getPublicStatus(params.id);
        return ok(data);
    });
}
export async function registerConsultationRoutes(app) {
    app.get("/:id/communications-preview", async (request) => {
        const params = request.params;
        const context = request.contextUser;
        const data = await service.getCommunicationsPreview({
            consultationId: params.id,
            accountId: context.accountId
        });
        return ok(data);
    });
    app.post("/", async (request) => {
        const context = request.contextUser;
        const body = createConsultationSchema.parse(request.body);
        const data = await service.createConsultation({
            accountId: context.accountId,
            userId: context.userId,
            consultation: body
        });
        return ok(data);
    });
}
