import { ok } from "../../shared/utils/http.js";
import { RefundsService } from "./refunds.service.js";
const service = new RefundsService();
export async function registerRefundRoutes(app) {
    app.get("/", async (request) => {
        const context = request.contextUser;
        const data = await service.list(context.accountId);
        return ok(data);
    });
    app.get("/pending", async (request) => {
        const context = request.contextUser;
        const data = await service.listPending(context.accountId);
        return ok(data);
    });
    app.post("/:id/process", async (request) => {
        const params = request.params;
        const context = request.contextUser;
        const data = await service.processDecision({
            decisionId: params.id,
            accountId: context.accountId,
            userId: context.userId
        });
        return ok(data);
    });
}
