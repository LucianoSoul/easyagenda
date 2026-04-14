import { AppError } from "../shared/errors/app-error.js";
import { RefundsRepository } from "../modules/refunds/refunds.repository.js";
import { RefundsService } from "../modules/refunds/refunds.service.js";
export async function processRefundDecisionsJob() {
    const repository = new RefundsRepository();
    const service = new RefundsService(repository);
    const pendingDecisions = await repository.findPending();
    for (const decision of pendingDecisions) {
        try {
            await service.processDecision({
                decisionId: decision.id,
                accountId: decision.account_id,
                userId: null
            });
        }
        catch (error) {
            if (error instanceof AppError && error.code === "NOT_FOUND") {
                continue;
            }
            throw error;
        }
    }
    return {
        processed: pendingDecisions.length
    };
}
