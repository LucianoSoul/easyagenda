import type { FastifyReply, FastifyRequest } from "fastify";
import { createRequestId } from "../shared/utils/ids.js";

export const requestContextMiddleware = async (
  req: FastifyRequest,
  _reply: FastifyReply
) => {
  req.requestContext = {
    requestId: String(req.headers["x-request-id"] ?? createRequestId()),
    accountId: req.contextUser?.accountId,
    userId: req.contextUser?.userId
  };
};
