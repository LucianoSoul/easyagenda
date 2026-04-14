import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { RefundsRepository } from "./refunds.repository.js";

export class RefundsService {
  constructor(private readonly refundsRepository = new RefundsRepository()) {}

  async list(accountId: string) {
    return this.refundsRepository.findAllByAccount(accountId);
  }

  async listPending(accountId: string) {
    return this.refundsRepository.findPendingByAccount(accountId);
  }

  async processDecision(input: {
    decisionId: string;
    accountId: string;
    userId: string | null;
  }) {
    const decision = await this.refundsRepository.getById(input.decisionId);

    if (!decision) {
      throw new AppError(404, "REFUND_DECISION_NOT_FOUND", "Decisao de reembolso nao encontrada.");
    }

    if (decision.account_id !== input.accountId) {
      throw new AppError(
        403,
        "REFUND_DECISION_ACCOUNT_MISMATCH",
        "Decisao de reembolso nao pertence a conta autenticada."
      );
    }

    if (
      decision.decision_status !== "pending" ||
      decision.execution_status !== "not_processed"
    ) {
      throw new AppError(
        400,
        "REFUND_DECISION_ALREADY_PROCESSED",
        "Decisao de reembolso nao esta pendente para processamento."
      );
    }

    const refundAmount = Number(decision.refund_amount ?? 0);
    const creditAmount = Number(decision.credit_amount ?? 0);

    if (refundAmount === 0 && creditAmount === 0) {
      await this.runWithFailureHandling({
        decisionId: decision.id,
        appliedBy: input.userId,
        gatewayResponse: {
          simulated: true,
          action: "no_action_needed",
          reason: "Both refund_amount and credit_amount are zero."
        },
        operation: () =>
          this.refundsRepository.markNoActionNeeded({
            decisionId: decision.id,
            appliedBy: input.userId
          })
      });

      return {
        refundDecision: await this.getRequiredDecisionById(decision.id)
      };
    }

    if (creditAmount > 0) {
      await this.runWithFailureHandling({
        decisionId: decision.id,
        appliedBy: input.userId,
        gatewayResponse: {
          simulated: true,
          action: "credit_created",
          reason: "Credit generated from refund decision."
        },
        operation: () =>
          this.refundsRepository.createCreditFromRefundDecision({
            decisionId: decision.id,
            appliedBy: input.userId
          })
      });

      const [refundDecision, credit] = await Promise.all([
        this.getRequiredDecisionById(decision.id),
        this.refundsRepository.getCreditBySourceDecisionId(decision.id)
      ]);

      if (!credit) {
        throw new AppError(
          500,
          "CREDIT_NOT_FOUND",
          "Credito nao encontrado apos o processamento da decisao."
        );
      }

      return {
        refundDecision,
        credit
      };
    }

    if (refundAmount > 0) {
      if (env.NODE_ENV === "production") {
        throw new AppError(404, "NOT_FOUND", "Endpoint indisponivel.");
      }

      const gatewayResponse = {
        simulated: true,
        provider: "mercado_pago",
        action: "refund_processed",
        mode: env.NODE_ENV,
        processed_at: new Date().toISOString(),
        message: "Refund processed through development simulation path."
      };

      await this.runWithFailureHandling({
        decisionId: decision.id,
        appliedBy: input.userId,
        gatewayResponse,
        operation: () =>
          this.refundsRepository.markProcessed({
            decisionId: decision.id,
            appliedBy: input.userId,
            gatewayRefundId: `dev_refund_${decision.id}`,
            gatewayResponse
          })
      });

      return {
        refundDecision: await this.getRequiredDecisionById(decision.id)
      };
    }

    throw new AppError(
      400,
      "REFUND_DECISION_INVALID_AMOUNTS",
      "Decisao de reembolso com valores invalidos para processamento."
    );
  }

  private async getRequiredDecisionById(decisionId: string) {
    const decision = await this.refundsRepository.getById(decisionId);

    if (!decision) {
      throw new AppError(404, "REFUND_DECISION_NOT_FOUND", "Decisao de reembolso nao encontrada.");
    }

    return decision;
  }

  private async runWithFailureHandling(input: {
    decisionId: string;
    appliedBy: string | null;
    gatewayResponse: Record<string, unknown> | null;
    operation: () => Promise<void>;
  }) {
    try {
      await input.operation();
    } catch (error) {
      await this.tryMarkFailed({
        decisionId: input.decisionId,
        appliedBy: input.appliedBy,
        gatewayResponse: input.gatewayResponse,
        error
      });

      throw new AppError(
        500,
        "REFUND_DECISION_PROCESSING_FAILED",
        "Nao foi possivel processar a decisao de reembolso."
      );
    }
  }

  private async tryMarkFailed(input: {
    decisionId: string;
    appliedBy: string | null;
    gatewayResponse: Record<string, unknown> | null;
    error: unknown;
  }) {
    try {
      await this.refundsRepository.markFailed({
        decisionId: input.decisionId,
        appliedBy: input.appliedBy,
        errorMessage: input.error instanceof Error ? input.error.message : "Unknown error",
        gatewayResponse: input.gatewayResponse
      });
    } catch (markFailedError) {
      console.error(markFailedError);
    }
  }
}
